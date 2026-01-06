import { State } from '../context/state.js';

export const DataManagement = {
    render() {
        const container = document.createElement('div');
        container.className = 'data-view';

        container.innerHTML = `
            <div class="view-header">
                <h2>Gestión de Datos</h2>
            </div>

            <section class="data-section card">
                <h3><i data-lucide="scan-line"></i> Escáner Inteligente (OCR/PDF)</h3>
                <p class="section-desc">Sube un PDF o foto de la programación para extraer datos automáticamente.</p>
                <div class="file-input-group">
                    <input type="file" id="smart-scan-input" accept="image/*,.pdf" hidden>
                    <button class="btn btn-primary" id="btn-trigger-scan">
                        <i data-lucide="camera"></i> Escanear Archivo
                    </button>
                    <div id="scan-loading" class="hidden">
                        <div class="spinner"></div> Procesando...
                    </div>
                </div>
            </section>

            <section class="data-section card">
                <h3><i data-lucide="file-spreadsheet"></i> Carga Masiva (Excel/CSV)</h3>
                <p class="section-desc">Importa tus registros actuales en formato CSV.</p>
                
                <div class="import-actions">
                    <div class="import-item">
                        <label>Discursantes Autorizados</label>
                        <input type="file" id="csv-auth" accept=".csv" class="small-file">
                    </div>
                    <div class="import-item">
                        <label>Discursantes Van (Excel)</label>
                        <input type="file" id="csv-outgoing" accept=".csv" class="small-file">
                    </div>
                    <div class="import-item">
                        <label>Discursantes Vienen (Excel)</label>
                        <input type="file" id="csv-incoming" accept=".csv" class="small-file">
                    </div>
                </div>
                <button class="btn btn-secondary" id="btn-import-all" style="width:100%; margin-top:1rem">
                    <i data-lucide="upload"></i> Procesar Archivos
                </button>
            </section>

            <section class="data-section card danger-zone">
                <h3 style="color:var(--danger)">Copia de Seguridad</h3>
                <button class="btn btn-secondary" id="btn-export-json">
                    <i data-lucide="download"></i> Exportar Todo (JSON)
                </button>
                <button class="btn btn-danger" id="btn-clear-all" style="margin-top:1rem">
                    <i data-lucide="trash-2"></i> Borrar Todo el Sistema
                </button>
            </section>
        `;

        this.initEvents(container);
        return container;
    },

    initEvents(container) {
        // Smart Scan
        container.querySelector('#btn-trigger-scan').addEventListener('click', () => container.querySelector('#smart-scan-input').click());
        container.querySelector('#smart-scan-input').addEventListener('change', (e) => this.handleSmartScan(e));

        // CSV Imports
        container.querySelector('#btn-import-all').addEventListener('click', () => this.processCSV(container));

        // Export/Clear
        container.querySelector('#btn-export-json').addEventListener('click', () => this.exportJSON());
        container.querySelector('#btn-clear-all').addEventListener('click', () => {
            if (confirm('¿ESTÁS SEGURO? Se borrarán todos los discursantes y programaciones.')) {
                localStorage.clear();
                window.location.reload();
            }
        });

        if (window.lucide) window.lucide.createIcons();
    },

    async handleSmartScan(e) {
        const file = e.target.files[0];
        if (!file) return;

        const loading = document.getElementById('scan-loading');
        loading.classList.remove('hidden');
        window.showToast('Analizando archivo...', 'info');

        try {
            let text = "";
            if (file.type === "application/pdf") {
                text = await this.extractTextFromPDF(file);
            } else {
                text = await this.extractTextFromImage(file);
            }

            this.showSmartParserModal(text);
        } catch (err) {
            console.error(err);
            window.showToast('Error al procesar el archivo', 'danger');
        } finally {
            loading.classList.add('hidden');
        }
    },

    async extractTextFromImage(file) {
        const { data: { text } } = await Tesseract.recognize(file, 'spa');
        return text;
    },

    async extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(" ") + "\n";
        }
        return fullText;
    },

    showSmartParserModal(text) {
        const modal = document.getElementById('smart-scan-container');
        modal.classList.remove('hidden');

        // Simple heuristic parsing: looking for dates and names
        const dateRegex = /\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/g;
        const potentialDates = text.match(dateRegex) || [];

        modal.innerHTML = `
            <div class="modal-content card" style="max-width: 800px">
                <div style="display:flex; justify-content:space-between; align-items:center">
                    <h3>Confirmar Datos Extraídos</h3>
                    <button class="btn btn-secondary btn-small" onclick="document.getElementById('smart-scan-container').classList.add('hidden')">×</button>
                </div>
                <p class="section-desc">Se han detectado los siguientes datos. Por favor, revisa y completa los campos faltantes.</p>
                
                <div class="smart-parsed-container" style="display:flex; flex-direction:column; gap:1rem">
                    <div class="form-group">
                        <label>Tipo de Registro</label>
                        <select id="smart-type">
                            <option value="incoming">Visita (Viene)</option>
                            <option value="outgoing">Salida (Va)</option>
                        </select>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                        <div class="form-group">
                            <label>Fecha Detectada</label>
                            <select id="smart-date">
                                ${potentialDates.map(d => `<option value="${this.formatDate(d)}">${d}</option>`).join('')}
                                <option value="">Ingresar manualmente...</option>
                            </select>
                            <input type="date" id="smart-date-manual" style="margin-top:5px">
                        </div>
                        <div class="form-group">
                            <label>Nombre Detectado</label>
                            <input type="text" id="smart-name" placeholder="Nombre completo">
                        </div>
                    </div>

                    <div class="raw-snippet">
                        <label>Texto extraído:</label>
                        <div class="text-raw-view" style="font-size:0.7rem; background:#000; padding:10px; max-height:150px; overflow-y:auto; border-radius:5px">
                            ${text.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>

                <div class="modal-actions" style="display:flex; gap:1rem; margin-top:1.5rem">
                    <button class="btn btn-secondary" onclick="document.getElementById('smart-scan-container').classList.add('hidden')" style="flex:1">Cancelar</button>
                    <button class="btn btn-primary" id="btn-save-parsed" style="flex:1">Guardar Registro</button>
                </div>
            </div>
        `;

        modal.querySelector('#btn-save-parsed').addEventListener('click', () => this.saveSmartRecord());
    },

    saveSmartRecord() {
        const type = document.getElementById('smart-type').value;
        const name = document.getElementById('smart-name').value;
        const dateManual = document.getElementById('smart-date-manual').value;
        const dateSelect = document.getElementById('smart-date').value;
        const date = dateManual || dateSelect;

        if (!name || !date) {
            window.showToast('Nombre y Fecha son obligatorios', 'warning');
            return;
        }

        if (type === 'incoming') {
            State.addIncomingEvent({
                id: crypto.randomUUID(),
                speaker_name: name,
                speaker_phone: '',
                congregation_origin: 'Detectado vía Scan',
                outline_number: '---',
                talk_title: 'Revisar título',
                song_number: '---',
                date,
                time: '12:00'
            });
        } else {
            // Outgoing requires a valid authorized speaker. We'll try to find or show a warning.
            const speaker = State.authorized.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
            if (speaker) {
                State.addOutgoingEvent({
                    id: crypto.randomUUID(),
                    speaker_id: speaker.id,
                    outline_number: '---',
                    talk_title: 'Revisar título',
                    destination_congregation: 'Detectado vía Scan',
                    date,
                    time: '12:00'
                });
            } else {
                window.showToast('No se encontró un discursante autorizado con ese nombre. Agrégalo primero.', 'danger');
                return;
            }
        }

        document.getElementById('smart-scan-container').classList.add('hidden');
        window.showToast('Registro guardado', 'success');
        document.getElementById(`nav-${type}`).click();
    },

    processCSV(container) {
        const authFile = container.querySelector('#csv-auth').files[0];
        const outFile = container.querySelector('#csv-outgoing').files[0];
        const inFile = container.querySelector('#csv-incoming').files[0];

        if (!authFile && !outFile && !inFile) {
            window.showToast('Selecciona al menos un archivo CSV', 'warning');
            return;
        }

        if (authFile) this.handleCSVAuth(authFile);
        if (outFile) this.handleCSVOutgoing(outFile);
        if (inFile) this.handleCSVIncoming(inFile);
    },

    readCSV(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsText(file);
        });
    },

    parseCSV(text) {
        const lines = text.split('\n');
        return lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
    },

    async handleCSVAuth(file) {
        const text = await this.readCSV(file);
        const rows = this.parseCSV(text);
        // Map: Nombre, Teléfono, Bosquejo, Título, Cántico
        rows.shift(); // Header
        rows.forEach(row => {
            if (row.length < 2) return;
            const [name, phone, outline, title, song] = row;
            // Check if speaker already exists
            let speaker = State.authorized.find(s => s.name === name);
            if (!speaker) {
                speaker = { id: crypto.randomUUID(), name, phone, talks: [] };
                State.authorized.push(speaker);
            }
            if (outline && title) {
                speaker.talks.push({ outline, title, song: song || '' });
            }
        });
        State.saveToStorage('speaker_app_authorized', State.authorized);
        window.showToast('Autorizados cargados', 'success');
    },

    async handleCSVOutgoing(file) {
        const text = await this.readCSV(file);
        const rows = this.parseCSV(text);
        // Map: Cong. Origen, Contacto Destino, Direccion, Nombre, Bosquejo, Título, Fecha, Horario
        rows.shift();
        rows.forEach(row => {
            if (row.length < 7) return;
            const [origin, contact, addr, name, outline, title, date, time] = row;
            // Find speaker by name
            const speaker = State.authorized.find(s => s.name === name);
            if (speaker) {
                State.outgoing.push({
                    id: crypto.randomUUID(),
                    speaker_id: speaker.id,
                    outline_number: outline,
                    talk_title: title,
                    destination_congregation: contact, // Using contact as dest for now per mapping
                    date: this.formatDate(date),
                    time
                });
            }
        });
        State.saveToStorage('speaker_app_outgoing', State.outgoing);
        window.showToast('Salidas cargadas', 'success');
    },

    async handleCSVIncoming(file) {
        const text = await this.readCSV(file);
        const rows = this.parseCSV(text);
        // Map: Cong. Origen, Teléfono, Nombre, Cancion, Bosquejo, Título, Fecha, Horario
        rows.shift();
        rows.forEach(row => {
            if (row.length < 7) return;
            const [origin, phone, name, song, outline, title, date, time] = row;
            State.incoming.push({
                id: crypto.randomUUID(),
                speaker_name: name,
                speaker_phone: phone,
                congregation_origin: origin,
                outline_number: outline,
                talk_title: title,
                song_number: song,
                date: this.formatDate(date),
                time
            });
        });
        State.saveToStorage('speaker_app_incoming', State.incoming);
        window.showToast('Visitas cargadas', 'success');
    },

    formatDate(dateStr) {
        // Try to convert Excel/CSV formats (DD/MM/YYYY or YYYY-MM-DD) to ISO
        if (!dateStr) return '';
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts[0].length === 4) return dateStr.replace(/\//g, '-');
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
        return dateStr;
    },

    exportJSON() {
        const data = {
            authorized: State.authorized,
            outgoing: State.outgoing,
            incoming: State.incoming
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `backup_discursos_${now}.json`;
        a.click();
    }
};
