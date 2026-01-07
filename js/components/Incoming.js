import { State } from '../context/state.js';

export const Incoming = {
    selectedIds: new Set(),

    render() {
        const container = document.createElement('div');
        container.className = 'events-view';

        container.innerHTML = `
            <div id="selection-bar" class="selection-bar hidden">
                <span id="selection-count">0 seleccionados</span>
                <button class="btn btn-danger btn-small" onclick="Incoming.handleBulkDelete()">
                    <i data-lucide="trash-2"></i> Borrar
                </button>
            </div>
            <div class="view-header">
                <h2>Discursantes que Vienen</h2>
                <button class="btn btn-primary" id="btn-add-event">
                    <i data-lucide="plus"></i> Agendar Visita
                </button>
            </div>

            <div class="event-list">
                <!-- Content will be injected -->
            </div>
        `;

        this.initEvents(container);
        this.renderList(container.querySelector('.event-list'), State.incoming);
        return container;
    },

    initEvents(container) {
        container.querySelector('#btn-add-event').addEventListener('click', () => this.showModal());
        if (window.lucide) window.lucide.createIcons();
    },

    renderList(target, list) {
        if (list.length === 0) {
            target.innerHTML = '<p class="empty-state">No hay visitas programadas.</p>';
            return;
        }

        target.innerHTML = list.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => this.renderEventCard(e)).join('');
        if (window.lucide) window.lucide.createIcons();
        this.updateSelectionBar();
    },

    renderEventCard(e) {
        const isSelected = this.selectedIds.has(e.id);
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const dayName = dayNames[new Date(e.date).getDay()];

        return `
            <div class="card event-card ${isSelected ? 'selected' : ''}" data-id="${e.id}">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${e.id}" onchange="Incoming.toggleSelection('${e.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="event-info" onclick="Incoming.showModal('${e.id}')">
                    <div class="event-date-badge">
                        <span class="day">${dayName}</span>
                        <span class="date">${e.date.split('-')[2]}</span>
                    </div>
                    <div class="event-details">
                        <strong>${e.speaker_name}</strong>
                        <p class="origin"><i data-lucide="map-pin"></i> ${e.congregation_origin}</p>
                        <span class="talk-info">#${e.outline_number} ${e.talk_title}</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn-icon" onclick="Incoming.showModal('${e.id}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon error" onclick="Incoming.handleSingleDelete('${e.id}')">
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
        if (!confirm(`¿Eliminar ${this.selectedIds.size} visitas?`)) return;
        const idsToDelete = Array.from(this.selectedIds);
        this.executeDelete(idsToDelete);
        this.selectedIds.clear();
    },

    handleSingleDelete(id) {
        if (!confirm('¿Eliminar esta visita?')) return;
        this.executeDelete([id]);
    },

    executeDelete(ids) {
        const backup = State.incoming.filter(e => ids.includes(e.id));
        State.incoming = State.incoming.filter(e => !ids.includes(e.id));
        State.saveToStorage('speaker_app_incoming', State.incoming);

        this.renderList(document.querySelector('.event-list'), State.incoming);

        window.showUndo('Eliminado', () => {
            State.incoming.push(...backup);
            State.saveToStorage('speaker_app_incoming', State.incoming);
            this.renderList(document.querySelector('.event-list'), State.incoming);
        });
    },

    showModal(id = null) {
        const event = id ? State.incoming.find(e => e.id === id) : {
            speaker_name: '', speaker_phone: '', congregation_origin: '', outline_number: '', talk_title: '', song_number: '', date: '', time: '12:00', contact_secondary: '', comments: ''
        };

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal-content card">
                <h3>${id ? 'Editar' : 'Programar'} Visita</h3>
                <form id="event-form">
                    <div class="form-group">
                        <label>Nombre del Discursante (Visitante)</label>
                        <input type="text" id="e-name" value="${event.speaker_name}" required>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="e-phone" value="${event.speaker_phone}" required>
                        </div>
                        <div class="form-group">
                            <label>Cong. Origen</label>
                            <input type="text" id="e-origin" list="origin-list" value="${event.congregation_origin}" required>
                            <datalist id="origin-list">
                                ${State.origins.map(o => `<option value="${o.name}">`).join('')}
                            </datalist>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 2fr; gap:10px">
                        <div class="form-group">
                            <label>Núm. Bosquejo</label>
                            <input type="text" id="e-outline" value="${event.outline_number}" required>
                        </div>
                        <div class="form-group">
                            <label>Título del Discurso</label>
                            <input type="text" id="e-title" value="${event.talk_title}" required>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px">
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="e-date" value="${event.date}" required>
                        </div>
                        <div class="form-group">
                            <label>Hora</label>
                            <input type="time" id="e-time" value="${event.time}">
                        </div>
                        <div class="form-group">
                            <label>Cántico</label>
                            <input type="text" id="e-song" value="${event.song_number}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Contacto Secundario</label>
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

        modal.querySelector('#event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
        });
    },

    handleSave(id) {
        const data = {
            id: id || crypto.randomUUID(),
            speaker_name: document.getElementById('e-name').value,
            speaker_phone: document.getElementById('e-phone').value,
            congregation_origin: document.getElementById('e-origin').value,
            outline_number: document.getElementById('e-outline').value,
            talk_title: document.getElementById('e-title').value,
            song_number: document.getElementById('e-song').value,
            date: document.getElementById('e-date').value,
            time: document.getElementById('e-time').value,
            contact_secondary: document.getElementById('e-secondary').value,
            comments: document.getElementById('e-comments').value
        };

        // 3-month repetition check
        const newDate = new Date(data.date);
        const threeMonthsAgo = new Date(newDate);
        threeMonthsAgo.setMonth(newDate.getMonth() - 3);

        const recent = State.incoming.find(e => {
            const d = new Date(e.date);
            return e.outline_number === data.outline_number && d >= threeMonthsAgo && d <= newDate && e.id !== data.id;
        });

        if (recent) {
            if (!confirm(`El discurso #${data.outline_number} se presentó el ${recent.date} (hace menos de 3 meses). ¿Deseas continuar?`)) return;
        }

        if (id) {
            State.incoming = State.incoming.map(e => e.id === id ? data : e);
        } else {
            State.incoming.push(data);
        }

        State.saveToStorage('speaker_app_incoming', State.incoming);
        document.getElementById('modal-container').classList.add('hidden');
        this.renderList(document.querySelector('.event-list'), State.incoming);
        window.showToast('Visita agendada', 'success');
    }
};

window.Incoming = Incoming;
