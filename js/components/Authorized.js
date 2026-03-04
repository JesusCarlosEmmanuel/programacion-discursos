import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';
import { CSVUtils } from '../utils/csv.js';
import { PhoneUtils } from '../utils/phone.js';

export const Authorized = {

    selectedIds: new Set(),

    render() {
        const container = document.createElement('div');
        container.className = 'authorized-view';

        container.innerHTML = `
            <div id="selection-bar" class="selection-bar hidden">
                <span id="selection-count">0 seleccionados</span>
                <button class="btn btn-danger btn-small" onclick="Authorized.handleBulkDelete()">
                    <i data-lucide="trash-2"></i> Borrar
                </button>
            </div>
            <div class="view-header" style="flex-wrap: wrap; gap: 0.5rem">
                <h2>Discursantes Autorizados</h2>
                <div style="display: flex; gap: 0.5rem; flex: 1; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" id="speaker-search" placeholder="Buscar hermano...">
                    </div>
                    <label class="btn btn-secondary btn-small" style="cursor: pointer; margin: 0">
                        <i data-lucide="upload"></i> Importar CSV
                        <input type="file" id="authorized-import-csv" accept=".csv, .txt" class="hidden">
                    </label>
                    <button class="btn btn-primary btn-small" id="btn-add-speaker" style="margin: 0">
                        <i data-lucide="plus"></i> Nuevo
                    </button>
                </div>
            </div>

            <div class="speaker-list">
                <!-- List will be rendered here -->
            </div>
        `;

        this.initEvents(container);
        this.renderList(container.querySelector('.speaker-list'), State.authorized);
        return container;
    },

    initEvents(container) {
        container.querySelector('#btn-add-speaker').addEventListener('click', () => this.showModal());

        container.querySelector('#speaker-search').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = State.authorized.filter(s => s.name.toLowerCase().includes(query));
            this.renderList(container.querySelector('.speaker-list'), filtered);
        });

        const importInput = container.querySelector('#authorized-import-csv');
        if (importInput) {
            importInput.addEventListener('change', (e) => this.handleImportCSV(e));
        }

        if (window.lucide) window.lucide.createIcons();
    },

    renderList(target, list) {
        if (list.length === 0) {
            target.innerHTML = '<p class="empty-state">No hay discursantes registrados.</p>';
            return;
        }

        target.innerHTML = list.map(s => this.renderSpeakerCard(s)).join('');
        if (window.lucide) window.lucide.createIcons();
        this.updateSelectionBar();
    },

    renderSpeakerCard(s) {
        const isSelected = this.selectedIds.has(s.id);
        const talkCount = s.talks?.length || 0;
        return `
            <div class="card speaker-card ${isSelected ? 'selected' : ''}" data-id="${s.id}">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${s.id}" onchange="Authorized.toggleSelection('${s.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="speaker-info" onclick="Authorized.showModal('${s.id}')">
                    <div class="speaker-card-main">
                        <strong>${s.name}</strong>
                        <p class="phone-link"><i data-lucide="phone"></i> ${s.phone || 'Sin teléfono'}</p>
                    </div>
                    <div class="talk-badges-container">
                        ${s.talks.slice(0, 3).map(t => `<span class="badge talk-badge">#${t.outline}</span>`).join('')}
                        ${talkCount > 3 ? `<span class="badge more-badge">+${talkCount - 3}</span>` : ''}
                    </div>
                    <p class="last-ref">Temas: ${s.talks.map(t => t.title).join(', ').substring(0, 50)}${s.talks.length > 0 ? '...' : 'Sin temas'}</p>
                </div>
                <div class="speaker-actions">
                    <button class="btn-icon" onclick="Authorized.showModal('${s.id}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon share" onclick="Authorized.shareSpeakerInfo('${s.id}')">
                        <i data-lucide="share-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    shareSpeakerInfo(id) {
        const speaker = State.authorized.find(s => s.id === id);
        if (!speaker) return;

        let message = `*Lista de Discursos - ${speaker.name}*\n\n`;
        speaker.talks.forEach(t => {
            message += `• *#${t.outline}* - ${t.title} (Cántico: ${t.song || '---'})\n`;
        });
        message += `\n_Enviado desde Programación Discursantes_`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    toggleSelection(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateSelectionBar();
        // Toggle class on card
        const card = document.querySelector(`.speaker-card[data-id="${id}"]`);
        if (card) card.classList.toggle('selected');
    },

    updateSelectionBar() {
        const bar = document.getElementById('selection-bar');
        const count = document.getElementById('selection-count');
        if (!bar || !count) return;

        if (this.selectedIds.size > 0) {
            bar.classList.remove('hidden');
            count.innerText = `${this.selectedIds.size} seleccionados`;
        } else {
            bar.classList.add('hidden');
        }
    },

    handleBulkDelete() {
        if (!confirm(`¿Eliminar ${this.selectedIds.size} discursantes?`)) return;

        const idsToDelete = Array.from(this.selectedIds);
        this.executeDelete(idsToDelete);
        this.selectedIds.clear();
    },

    handleSingleDelete(id) {
        if (!confirm('¿Eliminar este discursante?')) return;
        this.executeDelete([id]);
    },

    executeDelete(ids) {
        const backup = State.authorized.filter(s => ids.includes(s.id));
        State.authorized = State.authorized.filter(s => !ids.includes(s.id));
        State.saveToStorage('speaker_app_authorized', State.authorized);

        this.renderList(document.querySelector('.speaker-list'), State.authorized);

        window.showUndo('Eliminado', () => {
            State.authorized.push(...backup);
            State.saveToStorage('speaker_app_authorized', State.authorized);
            this.renderList(document.querySelector('.speaker-list'), State.authorized);
        });
    },

    showModal(id = null) {
        const speaker = id ? State.authorized.find(s => s.id === id) : { name: '', phone: '', talks: [], contact_secondary: '', comments: '' };
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>${id ? 'Editar' : 'Nuevo'} Discursante</h3>
                    ${id ? `<button class="btn btn-secondary btn-small" onclick="Authorized.shareSpeakerInfo('${id}')"><i data-lucide="share-2"></i> Compartir Temas</button>` : ''}
                </div>
                <form id="speaker-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" id="speaker-name" value="${speaker.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Teléfono (WhatsApp)</label>
                            <input type="tel" id="speaker-phone" value="${speaker.phone}" required placeholder="521...">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Contacto Secundario (Email/Referencia)</label>
                        <input type="text" id="speaker-secondary" value="${speaker.contact_secondary || ''}" placeholder="Opcional">
                    </div>
                    
                    <div class="talks-section-header">
                        <label><i data-lucide="book-open"></i> Discursos Disponibles</label>
                    </div>
                    <div id="talks-list" class="talks-scroll-area">
                        ${speaker.talks.map((t, i) => this.renderTalkField(t, i)).join('')}
                    </div>
                    <button type="button" class="btn btn-outline btn-small" id="btn-add-talk" style="width:100%; margin-top:0.5rem">
                        <i data-lucide="plus"></i> Añadir Discurso
                    </button>

                    <div class="form-group" style="margin-top:1rem">
                        <label>Notas Privadas</label>
                        <textarea id="speaker-comments" placeholder="Preferencias, fechas bloqueadas, etc.">${speaker.comments || ''}</textarea>
                    </div>

                    <div class="modal-actions">
                        <div style="display:flex; gap:10px">
                            <button type="button" class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
                            ${id ? `<button type="button" class="btn btn-icon error" onclick="Authorized.handleSingleDelete('${id}'); document.getElementById('modal-container').classList.add('hidden')"><i data-lucide="trash-2"></i></button>` : ''}
                        </div>
                        <button type="submit" class="btn btn-primary">Guardar Discursante</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        modal.querySelector('#btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));
        modal.querySelector('#btn-add-talk').addEventListener('click', () => {
            const list = modal.querySelector('#talks-list');
            const newIndex = list.children.length;
            const div = document.createElement('div');
            div.innerHTML = this.renderTalkField({ outline: '', title: '', song: '' }, newIndex);
            list.appendChild(div.firstElementChild);
            if (window.lucide) window.lucide.createIcons();
        });

        modal.querySelector('#speaker-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
        });
    },

    renderTalkField(talk, index) {
        return `
            <div class="talk-entry card" data-index="${index}" style="padding:0.75rem; margin-bottom:0.5rem">
                <div style="display:flex; gap:10px; margin-bottom:5px">
                    <input type="text" placeholder="Bosquejo" class="talk-outline" value="${talk.outline}" style="width: 30%">
                    <input type="text" placeholder="Título" class="talk-title" value="${talk.title}" style="flex: 1">
                </div>
                <div style="display:flex; gap:10px; align-items:center">
                    <input type="text" placeholder="Cántico" class="talk-song" value="${talk.song}" style="flex: 1">
                    <button type="button" class="btn-icon error" onclick="this.closest('.talk-entry').remove()">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    handleSave(id) {
        const name = document.getElementById('speaker-name').value;
        const phone = PhoneUtils.validate(document.getElementById('speaker-phone').value);
        const secondary = document.getElementById('speaker-secondary').value;

        const comments = document.getElementById('speaker-comments').value;
        const talkEntries = document.querySelectorAll('.talk-entry');

        const talks = Array.from(talkEntries).map(entry => ({
            outline: entry.querySelector('.talk-outline').value,
            title: entry.querySelector('.talk-title').value,
            song: entry.querySelector('.talk-song').value
        }));

        const newSpeaker = {
            id: id || crypto.randomUUID(),
            name,
            phone,
            contact_secondary: secondary,
            comments: comments,
            talks
        };

        if (id) {
            State.updateAuthorizedSpeaker(newSpeaker);
        } else {
            State.addAuthorizedSpeaker(newSpeaker);
        }

        document.getElementById('modal-container').classList.add('hidden');
        this.renderList(document.querySelector('.speaker-list'), State.authorized);
        window.showToast('Guardado correctamente', 'success');
    },

    handleImportCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const rows = CSVUtils.parseAuto(text);
                if (rows.length < 2) throw new Error("Archivo vacío o formato inválido");

                // Check headers
                // Based on image: Nombre discursante | No. Teléfono | No. Discurso | Título | Canción
                // It might not be exact, so we'll just check if there are roughly enough columns.
                // Assuming Name, Phone, Outline, Title, (optional Song)

                let speakersMap = {}; // Key: name.toLowerCase()

                // Load existing to map
                State.authorized.forEach(s => {
                    speakersMap[s.name.trim().toLowerCase()] = { ...s };
                });

                let parsedCount = 0;
                let isFirstRow = true;

                for (const row of rows) {
                    // Skip header row roughly by checking if first col looks like a header
                    if (isFirstRow && row[0].toLowerCase().includes('nombre') && row[1].toLowerCase().includes('tel')) {
                        isFirstRow = false;
                        continue;
                    }
                    if (row.length < 4) continue; // Need at least Name, Phone, Outline, Title

                    const name = row[0].trim();
                    const phone = PhoneUtils.validate(row[1].trim() || '');
                    const outline = row[2].trim();
                    const title = row[3].trim();
                    const song = row[4] ? row[4].trim() : '';

                    if (!name) continue;

                    const key = name.toLowerCase();

                    if (!speakersMap[key]) {
                        speakersMap[key] = {
                            id: crypto.randomUUID(),
                            name: name,
                            phone: phone,
                            contact_secondary: '',
                            comments: '',
                            talks: []
                        };
                    }

                    // Check if talk already exists
                    const existingTalk = speakersMap[key].talks.find(t => t.outline == outline);
                    if (!existingTalk && outline) {
                        speakersMap[key].talks.push({ outline, title, song });
                    }

                    parsedCount++;
                }

                State.authorized = Object.values(speakersMap);
                State.saveToStorage('speaker_app_authorized', State.authorized);

                this.renderList(document.querySelector('.speaker-list'), State.authorized);
                window.showToast(`Se importaron ${parsedCount} discursos exitosamente`, 'success');

            } catch (error) {
                console.error("Error importing CSV:", error);
                window.showToast('Error al importar el archivo CSV', 'danger');
            }
            // reset file input
            event.target.value = '';
        };
        reader.readAsText(file);
    }
};

window.Authorized = Authorized;
