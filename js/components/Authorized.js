import { State } from '../context/state.js';

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
            <div class="view-header">
                <h2>Discursantes Autorizados</h2>
                <div class="search-box">
                    <i data-lucide="search"></i>
                    <input type="text" id="speaker-search" placeholder="Buscar hermano...">
                </div>
                <button class="btn btn-primary" id="btn-add-speaker">
                    <i data-lucide="plus"></i> Nuevo
                </button>
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
        return `
            <div class="card speaker-card ${isSelected ? 'selected' : ''}" data-id="${s.id}">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${s.id}" onchange="Authorized.toggleSelection('${s.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="speaker-info" onclick="Authorized.showModal('${s.id}')">
                    <strong>${s.name}</strong>
                    <p>${s.phone || 'Sin teléfono'}</p>
                    <div class="talk-badges">
                        ${s.talks.map(t => `<span class="badge">#${t.outline}</span>`).join('')}
                    </div>
                </div>
                <div class="speaker-actions">
                    <button class="btn-icon" onclick="Authorized.showModal('${s.id}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon error" onclick="Authorized.handleSingleDelete('${s.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
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
                <h3>${id ? 'Editar' : 'Nuevo'} Discursante</h3>
                <form id="speaker-form">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="speaker-name" value="${speaker.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono (WhatsApp)</label>
                        <input type="tel" id="speaker-phone" value="${speaker.phone}" required placeholder="Ej: 521234567890">
                    </div>
                    <div class="form-group">
                        <label>Contacto Secundario (Email/Red Social)</label>
                        <input type="text" id="speaker-secondary" value="${speaker.contact_secondary || ''}" placeholder="Opcional">
                    </div>
                    <div class="form-group">
                        <label>Comentarios / Notas</label>
                        <textarea id="speaker-comments" placeholder="Notas adicionales">${speaker.comments || ''}</textarea>
                    </div>
                    
                    <div class="talks-section">
                        <label>Discursos Registrados</label>
                        <div id="talks-list">
                            ${speaker.talks.map((t, i) => this.renderTalkField(t, i)).join('')}
                        </div>
                        <button type="button" class="btn btn-secondary btn-small" id="btn-add-talk" style="width:100%; margin-top:0.5rem">
                            <i data-lucide="plus"></i> Añadir Discurso
                        </button>
                    </div>

                    <div class="modal-actions" style="margin-top:1.5rem">
                        <div style="display:flex; gap:10px">
                            <button type="button" class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
                            ${id ? `<button type="button" class="btn btn-danger" onclick="Authorized.handleSingleDelete('${id}'); document.getElementById('modal-container').classList.add('hidden')"><i data-lucide="trash-2"></i></button>` : ''}
                        </div>
                        <button type="submit" class="btn btn-primary">Guardar</button>
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
        const phone = document.getElementById('speaker-phone').value;
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
    }
};

window.Authorized = Authorized;
