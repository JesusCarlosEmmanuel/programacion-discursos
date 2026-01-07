import { State } from '../context/state.js';

export const Outgoing = {
    selectedIds: new Set(),

    render() {
        const container = document.createElement('div');
        container.className = 'events-view';

        container.innerHTML = `
            <div id="selection-bar" class="selection-bar hidden">
                <span id="selection-count">0 seleccionados</span>
                <button class="btn btn-danger btn-small" onclick="Outgoing.handleBulkDelete()">
                    <i data-lucide="trash-2"></i> Borrar
                </button>
            </div>
            <div class="view-header">
                <h2>Discursantes que Van</h2>
                <button class="btn btn-primary" id="btn-add-event">
                    <i data-lucide="plus"></i> Agendar Salida
                </button>
            </div>

            <div class="event-list">
                <!-- Content will be injected -->
            </div>
        `;

        this.initEvents(container);
        this.renderList(container.querySelector('.event-list'), State.outgoing);
        return container;
    },

    initEvents(container) {
        container.querySelector('#btn-add-event').addEventListener('click', () => this.showModal());
        if (window.lucide) window.lucide.createIcons();
    },

    renderList(target, list) {
        if (list.length === 0) {
            target.innerHTML = '<p class="empty-state">No hay salidas programadas.</p>';
            return;
        }

        target.innerHTML = list.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => this.renderEventCard(e)).join('');
        if (window.lucide) window.lucide.createIcons();
        this.updateSelectionBar();
    },

    renderEventCard(e) {
        const speaker = State.authorized.find(s => s.id === e.speaker_id);
        const isSelected = this.selectedIds.has(e.id);
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const dayName = dayNames[new Date(e.date).getDay()];

        return `
            <div class="card event-card ${isSelected ? 'selected' : ''}" data-id="${e.id}">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${e.id}" onchange="Outgoing.toggleSelection('${e.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="event-info" onclick="Outgoing.showModal('${e.id}')">
                    <div class="event-date-badge">
                        <span class="day">${dayName}</span>
                        <span class="date">${e.date.split('-')[2]}</span>
                    </div>
                    <div class="event-details">
                        <strong>${speaker?.name || 'Desconocido'}</strong>
                        <p class="destination"><i data-lucide="map-pin"></i> ${e.destination_congregation}</p>
                        <span class="talk-info">#${e.outline_number} ${e.talk_title}</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn-icon" onclick="Outgoing.showModal('${e.id}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon error" onclick="Outgoing.handleSingleDelete('${e.id}')">
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
        const card = document.querySelector(`.event-card[data-id="${id}"]`);
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
        if (!confirm(`¿Eliminar ${this.selectedIds.size} eventos?`)) return;
        const idsToDelete = Array.from(this.selectedIds);
        this.executeDelete(idsToDelete);
        this.selectedIds.clear();
    },

    handleSingleDelete(id) {
        if (!confirm('¿Eliminar este evento?')) return;
        this.executeDelete([id]);
    },

    executeDelete(ids) {
        const backup = State.outgoing.filter(e => ids.includes(e.id));
        State.outgoing = State.outgoing.filter(e => !ids.includes(e.id));
        State.saveToStorage('speaker_app_outgoing', State.outgoing);

        this.renderList(document.querySelector('.event-list'), State.outgoing);

        window.showUndo('Eliminado', () => {
            State.outgoing.push(...backup);
            State.saveToStorage('speaker_app_outgoing', State.outgoing);
            this.renderList(document.querySelector('.event-list'), State.outgoing);
        });
    },

    showModal(id = null) {
        const event = id ? State.outgoing.find(e => e.id === id) : {
            speaker_id: '', outline_number: '', talk_title: '', destination_congregation: '', date: '', time: '10:00', contact_secondary: '', comments: ''
        };

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        const destinations = State.destinations;

        modal.innerHTML = `
            <div class="modal-content card">
                <h3>${id ? 'Editar' : 'Programar'} Salida</h3>
                <form id="event-form">
                    <div class="form-group">
                        <label>Discursante (Local)</label>
                        <select id="e-speaker" required>
                            <option value="">Seleccionar...</option>
                            ${State.authorized.map(s => `<option value="${s.id}" ${s.id === event.speaker_id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Congregación Destino</label>
                        <input type="text" id="e-destination" list="dest-list" value="${event.destination_congregation}" required placeholder="Nombre de la congregación">
                        <datalist id="dest-list">
                            ${destinations.map(d => `<option value="${d.name}">`).join('')}
                        </datalist>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                        <div class="form-group">
                            <label>Núm. Bosquejo</label>
                            <input type="text" id="e-outline" value="${event.outline_number}" required>
                        </div>
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="e-date" value="${event.date}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Título del Discurso</label>
                        <input type="text" id="e-title" value="${event.talk_title}" required>
                    </div>

                    <div class="form-group">
                        <label>Contacto Secundario (Destino)</label>
                        <input type="text" id="e-secondary" value="${event.contact_secondary || ''}" placeholder="Opcional">
                    </div>
                    <div class="form-group">
                        <label>Comentarios / Notas</label>
                        <textarea id="e-comments" placeholder="Notas adicionales">${event.comments || ''}</textarea>
                    </div>

                    <div class="modal-actions" style="margin-top:1.5rem">
                        <button type="button" class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Agendar</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
        modal.querySelector('#btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));

        // Auto-fill title from speaker if outline matches
        modal.querySelector('#e-speaker').addEventListener('change', (e) => this.autoFill(e.target.value));
        modal.querySelector('#e-outline').addEventListener('input', (e) => this.autoFill(modal.querySelector('#e-speaker').value, e.target.value));

        modal.querySelector('#event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
        });
    },

    autoFill(speakerId, outline = null) {
        if (!speakerId) return;
        const speaker = State.authorized.find(s => s.id === speakerId);
        if (!speaker) return;

        if (outline) {
            const talk = speaker.talks.find(t => t.outline === outline);
            if (talk) document.getElementById('e-title').value = talk.title;
        } else {
            // If only speaker changed, find the first talk
            if (speaker.talks.length === 1) {
                document.getElementById('e-outline').value = speaker.talks[0].outline;
                document.getElementById('e-title').value = speaker.talks[0].title;
            }
        }
    },

    handleSave(id) {
        const data = {
            id: id || crypto.randomUUID(),
            speaker_id: document.getElementById('e-speaker').value,
            destination_congregation: document.getElementById('e-destination').value,
            outline_number: document.getElementById('e-outline').value,
            talk_title: document.getElementById('e-title').value,
            date: document.getElementById('e-date').value,
            time: '12:00', // Default
            contact_secondary: document.getElementById('e-secondary').value,
            comments: document.getElementById('e-comments').value
        };

        // Monthly limit check
        const dateObj = new Date(data.date);
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();
        const count = State.outgoing.filter(e => {
            const d = new Date(e.date);
            return e.speaker_id === data.speaker_id && d.getMonth() === month && d.getFullYear() === year && e.id !== data.id;
        }).length;

        if (count >= 1) {
            if (!confirm('Este discursante ya tiene una salida este mes. ¿Continuar?')) return;
        }

        if (id) {
            State.outgoing = State.outgoing.map(e => e.id === id ? data : e);
        } else {
            State.outgoing.push(data);
        }

        State.saveToStorage('speaker_app_outgoing', State.outgoing);
        document.getElementById('modal-container').classList.add('hidden');
        this.renderList(document.querySelector('.event-list'), State.outgoing);
        window.showToast('Actualizado', 'success');
    }
};

window.Outgoing = Outgoing;
