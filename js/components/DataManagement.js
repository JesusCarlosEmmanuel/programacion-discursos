import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';


export const DataManagement = {
    render() {
        const container = document.createElement('div');
        container.className = 'data-view';

        container.innerHTML = `
             <div class="view-header">
                <h2>Ajustes y Datos</h2>
            </div>

            <section class="data-section card">
                <h3><i data-lucide="home"></i> Perfil de mi Congregación</h3>
                <p class="section-desc">Datos locales para reportes y mensajes automáticos.</p>
                <form id="congregation-profile-form" style="margin-top:1rem">
                    <div class="form-group">
                        <label>Nombre de la Congregación</label>
                        <input type="text" id="cong-name" placeholder="Ej: Valle de México">
                    </div>
                    <div class="form-group">
                        <label>Dirección / Domicilio</label>
                        <input type="text" id="cong-address" placeholder="Ubicación completa">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div class="form-group">
                            <label>Coordinador (Nombre)</label>
                            <input type="text" id="cong-coord-name" placeholder="Nombre">
                        </div>
                        <div class="form-group">
                            <label>Coordinador (Tel)</label>
                            <input type="tel" id="cong-coord-phone" placeholder="WhatsApp">
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div class="form-group">
                            <label>Encargado (Nombre)</label>
                            <input type="text" id="cong-sched-name" placeholder="Nombre">
                        </div>
                        <div class="form-group">
                            <label>Encargado (Tel)</label>
                            <input type="tel" id="cong-sched-phone" placeholder="WhatsApp">
                        </div>
                    </div>
                    <div class="form-row" style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div class="form-group">
                            <label>Día Reunión FDS</label>
                            <select id="cong-day">
                                <option value="">Seleccionar día</option>
                                <option value="Sábado">Sábado</option>
                                <option value="Domingo">Domingo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Horario</label>
                            <input type="time" id="cong-time">
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary" style="width:100%">
                        <i data-lucide="save"></i> Guardar Perfil
                    </button>
                </form>
            </section>

            <section class="data-section card">
                <div class="section-header">
                    <div>
                        <h3><i data-lucide="calendar-x"></i> Fechas de Excepción</h3>
                        <p class="section-desc">Asambleas, Memorial u otras fechas sin discurso visitante.</p>
                    </div>
                    <button class="btn btn-primary btn-small" id="btn-add-exception">
                        <i data-lucide="plus"></i> Agregar
                    </button>
                </div>
                <div id="exception-list" style="margin-top:0.75rem; display:flex; flex-direction:column; gap:0.5rem">
                    <!-- populated by JS -->
                </div>
                <div id="exception-form" class="hidden" style="margin-top:1rem; padding-top:1rem; border-top:1px solid var(--glass-border)">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="exc-date">
                        </div>
                        <div class="form-group" style="flex:2">
                            <label>Motivo / Título</label>
                            <input type="text" id="exc-title" placeholder="Ej: Asamblea de Circuito">
                        </div>
                    </div>
                    <div style="display:flex; gap:0.5rem">
                        <button class="btn btn-primary btn-small" id="btn-save-exception"><i data-lucide="check"></i> Guardar</button>
                        <button class="btn btn-secondary btn-small" id="btn-cancel-exception">Cancelar</button>
                    </div>
                </div>
            </section>

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
                <h3 style="color:var(--danger)">Copia de Seguridad y Limpieza</h3>
                <p class="section-desc">Si tienes muchos registros duplicados o la app va lenta, usa Borrar Todo.</p>
                <div style="display:flex; flex-direction:column; gap:10px">
                    <button class="btn btn-secondary" id="btn-export-json">
                        <i data-lucide="download"></i> Exportar Todo (JSON)
                    </button>
                    <div class="import-json-group">
                        <input type="file" id="import-json-input" accept=".json" hidden>
                        <button class="btn btn-secondary" id="btn-import-json">
                            <i data-lucide="upload"></i> Importar Backup (JSON)
                        </button>
                    </div>
                    <button class="btn btn-danger" id="btn-clear-all">
                        <i data-lucide="trash-2"></i> BORRAR TODO EL SISTEMA
                    </button>

                    <button class="btn btn-secondary" style="background:#475569; color:white" onclick="window.hardReset()">
                        <i data-lucide="refresh-cw"></i> Forzar Limpieza de Cache (Safari/Chrome)
                    </button>
                </div>
            </section>
        `;

        this.initEvents(container);
        return container;
    },

    initEvents(container) {
        // Congregation Profile
        const profForm = container.querySelector('#congregation-profile-form');
        const prof = State.congregation;
        if (prof) {
            profForm.querySelector('#cong-name').value = prof.name || '';
            profForm.querySelector('#cong-address').value = prof.address || '';
            profForm.querySelector('#cong-coord-name').value = prof.coordinator?.name || '';
            profForm.querySelector('#cong-coord-phone').value = prof.coordinator?.phone || '';
            profForm.querySelector('#cong-sched-name').value = prof.scheduler?.name || '';
            profForm.querySelector('#cong-sched-phone').value = prof.scheduler?.phone || '';
            profForm.querySelector('#cong-day').value = prof.meetingDay || '';
            profForm.querySelector('#cong-time').value = prof.meetingTime || '';
        }

        profForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const data = {
                name: profForm.querySelector('#cong-name').value,
                address: profForm.querySelector('#cong-address').value,
                coordinator: {
                    name: profForm.querySelector('#cong-coord-name').value,
                    phone: profForm.querySelector('#cong-coord-phone').value
                },
                scheduler: {
                    name: profForm.querySelector('#cong-sched-name').value,
                    phone: PhoneUtils.validate(profForm.querySelector('#cong-sched-phone').value)
                },
                meetingDay: profForm.querySelector('#cong-day').value,
                meetingTime: profForm.querySelector('#cong-time').value
            };
            State.updateCongregation(data);

            window.showToast('Perfil actualizado', 'success');
        });

        // Smart Scan
        container.querySelector('#btn-trigger-scan').addEventListener('click', () => container.querySelector('#smart-scan-input').click());
        container.querySelector('#smart-scan-input').addEventListener('change', (e) => this.handleSmartScan(e));

        // CSV Imports
        container.querySelector('#btn-import-all').addEventListener('click', () => this.processCSV(container));

        // Export/Clear
        container.querySelector('#btn-export-json').addEventListener('click', () => this.exportJSON());
        container.querySelector('#btn-import-json').addEventListener('click', () => container.querySelector('#import-json-input').click());
        container.querySelector('#import-json-input').addEventListener('change', (e) => this.handleImportJSON(e));

        container.querySelector('#btn-clear-all').addEventListener('click', () => {

            if (confirm('¿ESTÁS SEGURO? Se borrarán todos los discursantes y programaciones.')) {
                localStorage.clear();
                window.location.reload();
            }
        });

        this.initExceptions(container);
        if (window.lucide) window.lucide.createIcons();
    },

    initExceptions(container) {
        const renderExceptions = () => {
            const list = container.querySelector('#exception-list');
            const exceptions = State.exceptions || [];
            if (exceptions.length === 0) {
                list.innerHTML = `<p style="color:var(--text-dim); font-size:0.85rem">Sin excepciones registradas.</p>`;
                return;
            }
            list.innerHTML = exceptions.map(ex => `
                <div class="exception-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:0.6rem 1rem">
                    <div>
                        <strong style="font-size:0.9rem">${ex.title}</strong>
                        <p style="font-size:0.8rem; color:var(--text-dim)">${ex.date}</p>
                    </div>
                    <button class="btn-icon" onclick="DataManagement.deleteException('${ex.id}')" style="color:var(--danger)">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `).join('');
            if (window.lucide) window.lucide.createIcons();
        };

        renderExceptions();

        container.querySelector('#btn-add-exception').addEventListener('click', () => {
            container.querySelector('#exception-form').classList.remove('hidden');
            container.querySelector('#btn-add-exception').classList.add('hidden');
        });

        container.querySelector('#btn-cancel-exception').addEventListener('click', () => {
            container.querySelector('#exception-form').classList.add('hidden');
            container.querySelector('#btn-add-exception').classList.remove('hidden');
        });

        container.querySelector('#btn-save-exception').addEventListener('click', () => {
            const date = container.querySelector('#exc-date').value;
            const title = container.querySelector('#exc-title').value.trim();
            if (!date || !title) { window.showToast('Completa fecha y motivo', 'warning'); return; }
            State.addException({ id: crypto.randomUUID(), date, title });
            container.querySelector('#exc-date').value = '';
            container.querySelector('#exc-title').value = '';
            container.querySelector('#exception-form').classList.add('hidden');
            container.querySelector('#btn-add-exception').classList.remove('hidden');
            renderExceptions();
            window.showToast('Excepción guardada', 'success');
        });
    },

    deleteException(id) {
        State.deleteException(id);
        // Re-render the exception list
        const list = document.querySelector('#exception-list');
        if (!list) return;
        const exceptions = State.exceptions || [];
        if (exceptions.length === 0) {
            list.innerHTML = `<p style="color:var(--text-dim); font-size:0.85rem">Sin excepciones registradas.</p>`;
            return;
        }
        list.innerHTML = exceptions.map(ex => `
            <div class="exception-item" style="display:flex; justify-content:space-between; align-items:center; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:10px; padding:0.6rem 1rem">
                <div>
                    <strong style="font-size:0.9rem">${ex.title}</strong>
                    <p style="font-size:0.8rem; color:var(--text-dim)">${ex.date}</p>
                </div>
                <button class="btn-icon" onclick="DataManagement.deleteException('${ex.id}')" style="color:var(--danger)">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `).join('');
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

        // Logic 2.0: Extract multiple blocks
        const rows = this.parseEngine2(text);

        modal.innerHTML = `
            <div class="modal-content card" style="max-width: 95vw; width: 1000px; height: 90vh; display: flex; flex-direction: column;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1rem">
                    <div style="display:flex; align-items:center; gap:10px">
                        <i data-lucide="scan-eye" style="color:var(--primary)"></i>
                        <h3>Revisión de Datos (Scanner 2.0)</h3>
                    </div>
                    <button class="btn btn-secondary btn-small" onclick="document.getElementById('smart-scan-container').classList.add('hidden')">×</button>
                </div>
                
                <div class="table-responsive" style="flex: 1; overflow-y: auto; margin-bottom: 1rem; border: 1px solid var(--text-dim); border-radius: 8px">
                    <table class="smart-table" style="width: 100%; border-collapse: collapse;">
                        <thead style="position: sticky; top: 0; background: var(--bg-dark); z-index: 10">
                            <tr>
                                <th>Tipo</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Nombre</th>
                                <th>Congregación</th>
                                <th>Bosquejo</th>
                                <th>Título</th>
                                <th>Borrar</th>
                            </tr>
                        </thead>
                        <tbody id="smart-table-body">
                            ${rows.map((row, idx) => `
                                <tr data-idx="${idx}">
                                    <td>
                                        <select class="s-type">
                                            <option value="incoming" ${row.type === 'incoming' ? 'selected' : ''}>Viene</option>
                                            <option value="outgoing" ${row.type === 'outgoing' ? 'selected' : ''}>Van</option>
                                        </select>
                                    </td>
                                    <td><input type="date" class="s-date" value="${row.date}"></td>
                                    <td><input type="time" class="s-time" value="${row.time || '10:00'}"></td>
                                    <td><input type="text" class="s-name" value="${row.name}"></td>
                                    <td><input type="text" class="s-cong" value="${row.congregation}"></td>
                                    <td><input type="text" class="s-outline" value="${row.outline}"></td>
                                    <td><input type="text" class="s-title" value="${row.title}"></td>
                                    <td><button class="btn-icon" onclick="this.closest('tr').remove()"><i data-lucide="trash"></i></button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="modal-footer" style="padding-top: 1rem; border-top: 1px solid var(--text-dim); display:flex; justify-content: space-between; align-items:center">
                    <p style="font-size: 0.8rem; color: var(--text-dim)">Se detectaron ${rows.length} registros posibles. Revisa antes de guardar.</p>
                    <div style="display:flex; gap:1rem">
                        <button class="btn btn-secondary" onclick="document.getElementById('smart-scan-container').classList.add('hidden')">Cancelar</button>
                        <button class="btn btn-primary" id="btn-save-batch">Guardar Todo</button>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
        modal.querySelector('#btn-save-batch').addEventListener('click', () => this.saveBatchRecords());
    },

    parseEngine2(text) {
        const lines = text.split('\n').filter(l => l.trim().length > 5);
        const results = [];

        // Enhanced Patterns
        const dateRegex = /(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})/;
        const timeRegex = /(\d{1,2}):(\d{2})/;
        const outlineRegex = /(?:#|bosquejo|n[úum]\.?)\s?(\d{1,3})/i;
        const phoneRegex = /(\d{10,13})/;

        lines.forEach(line => {
            const dateMatch = line.match(dateRegex);
            if (dateMatch) {
                const date = this.formatDate(dateMatch[0]);
                const timeMatch = line.match(timeRegex);
                const outlineMatch = line.match(outlineRegex);
                const phoneMatch = line.match(phoneRegex);

                // Try to isolate name and congregation
                let cleanLine = line.replace(dateMatch[0], '')
                    .replace(timeMatch ? timeMatch[0] : '', '')
                    .replace(outlineMatch ? outlineMatch[0] : '', '')
                    .replace(phoneMatch ? phoneMatch[0] : '', '')
                    .trim();

                let name = "---", congregation = "---";
                if (cleanLine.includes(' - ')) {
                    const parts = cleanLine.split(' - ');
                    name = parts[0].trim();
                    congregation = parts[1].trim();
                } else if (cleanLine.includes('(')) {
                    const parts = cleanLine.split('(');
                    name = parts[0].trim();
                    congregation = parts[1].replace(')', '').trim();
                }

                results.push({
                    type: line.toLowerCase().includes('van') || line.toLowerCase().includes('salida') ? 'outgoing' : 'incoming',
                    date: date,
                    time: timeMatch ? timeMatch[0] : '10:00',
                    name: name,
                    congregation: congregation,
                    outline: outlineMatch ? outlineMatch[1] : '---',
                    title: '---'
                });
            }
        });


        // If no dates found, at least provide one empty row for manual entry
        if (results.length === 0) {
            results.push({ type: 'incoming', date: '', time: '10:00', name: '', congregation: '', outline: '', title: '' });
        }

        return results;
    },

    saveBatchRecords() {
        const rows = document.querySelectorAll('#smart-table-body tr');
        let count = 0;

        rows.forEach(tr => {
            const type = tr.querySelector('.s-type').value;
            const date = tr.querySelector('.s-date').value;
            const time = tr.querySelector('.s-time').value;
            const name = tr.querySelector('.s-name').value;
            const cong = tr.querySelector('.s-cong').value;
            const outline = tr.querySelector('.s-outline').value;
            const title = tr.querySelector('.s-title').value;

            if (!name || name === '---') return;

            if (type === 'incoming') {
                State.addIncomingEvent({
                    id: crypto.randomUUID(),
                    speaker_name: name,
                    speaker_phone: PhoneUtils.validate(tr.querySelector('.s-phone')?.value || ''),
                    congregation_origin: cong,
                    outline_number: outline,
                    talk_title: title,
                    song_number: '---',
                    date,
                    time
                });

            } else {
                const speaker = State.authorized.find(s => s.name.toLowerCase().includes(name.toLowerCase()));
                if (speaker) {
                    State.addOutgoingEvent({
                        id: crypto.randomUUID(),
                        speaker_id: speaker.id,
                        outline_number: outline,
                        talk_title: title,
                        destination_congregation: cong,
                        date,
                        time
                    });
                }
            }
            count++;
        });

        document.getElementById('smart-scan-container').classList.add('hidden');
        window.showToast(`Se guardaron ${count} registros`, 'success');
        router.navigate('dashboard');
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
                speaker = { id: crypto.randomUUID(), name, phone: PhoneUtils.validate(phone), talks: [] };
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
                speaker_phone: PhoneUtils.validate(phone),
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
            incoming: State.incoming,
            congregation: State.congregation,
            destinations: State.destinations,
            origins: State.origins,
            exceptions: State.exceptions || []
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const now = new Date().toISOString().split('T')[0];
        a.href = url;
        a.download = `backup_discursos_${now}.json`;
        a.click();
    },

    async handleImportJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (confirm('¿Importar datos? Esto sobrescribirá la información actual.')) {
                if (data.authorized) {
                    State.authorized = data.authorized;
                    State.saveToStorage('speaker_app_authorized', State.authorized);
                }
                if (data.outgoing) {
                    State.outgoing = data.outgoing;
                    State.saveToStorage('speaker_app_outgoing', State.outgoing);
                }
                if (data.incoming) {
                    State.incoming = data.incoming;
                    State.saveToStorage('speaker_app_incoming', State.incoming);
                }
                if (data.congregation) {
                    State.congregation = data.congregation;
                    State.saveToStorage('speaker_app_congregation', State.congregation);
                }
                if (data.destinations) {
                    State.destinations = data.destinations;
                    State.saveToStorage('speaker_app_destinations', State.destinations);
                }
                if (data.origins) {
                    State.origins = data.origins;
                    State.saveToStorage('speaker_app_origins', State.origins);
                }
                if (data.exceptions) {
                    State.exceptions = data.exceptions;
                    State.saveToStorage('speaker_app_exceptions', State.exceptions);
                }

                window.showToast('Datos importados correctamente', 'success');
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err) {
            console.error(err);
            window.showToast('Error al importar JSON', 'danger');
        }
    }
};

window.DataManagement = DataManagement;
