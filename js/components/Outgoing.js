import { State } from '../context/state.js';
import { EventService } from '../services/EventService.js';

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
        const dateObj = new Date(e.date + 'T12:00:00'); // Prevent shifting
        const dayName = dayNames[dateObj.getDay()];

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
        EventService.deleteEvents('outgoing', ids, () => {
            if (document.querySelector('.event-list')) {
                this.renderList(document.querySelector('.event-list'), State.outgoing);
            }
        });
        this.renderList(document.querySelector('.event-list'), State.outgoing);
    },

    showModal(id = null) {
        const event = id ? State.outgoing.find(e => e.id === id) : {
            speaker_id: '', outline_number: '', talk_title: '', song_number: '', destination_congregation: '', date: '', time: '10:00', comments: ''
        };

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        const destinations = State.destinations;
        const destCong = State.destinations.find(d => d.name === event.destination_congregation);

        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>${id ? 'Editar' : 'Programar'} Salida</h3>
                    ${id ? `<button class="btn btn-secondary btn-small" onclick="Outgoing.sharePreview('${id}')"><i data-lucide="image"></i> Generar Confirmación</button>` : ''}
                </div>
                <form id="event-form">
                    <div class="form-section-title">Discursante de Mi Congregación</div>
                    <div class="form-group">
                        <label>Seleccionar Hermano</label>
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
                        ${destCong ? `<p class="hint-text">Contacto: ${destCong.contact_name} (${destCong.contact_phone})</p>` : ''}
                    </div>

                    <div class="form-section-title">Detalles de la Asignación</div>
                    <div class="form-row">
                        <div class="form-group" style="flex: 0 0 30%">
                            <label>Bosquejo #</label>
                            <input type="text" id="e-outline" value="${event.outline_number}" required>
                        </div>
                        <div class="form-group" style="flex: 1">
                            <label>Título</label>
                            <input type="text" id="e-title" value="${event.talk_title}" required>
                        </div>
                        <div class="form-group" style="flex: 0 0 20%">
                            <label>Cántico</label>
                            <input type="text" id="e-song" value="${event.song_number || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="e-date" value="${event.date}" required>
                        </div>
                        <div class="form-group">
                            <label>Hora</label>
                            <input type="time" id="e-time" value="${event.time}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Notas / Comentarios</label>
                        <textarea id="e-comments" placeholder="Notas adicionales">${event.comments || ''}</textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${id ? 'Actualizar' : 'Agendar Salida'}</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
        modal.querySelector('#btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));

        // Auto-fill title and song from speaker if outline matches
        modal.querySelector('#e-speaker').addEventListener('change', (e) => this.autoFill(e.target.value));
        modal.querySelector('#e-outline').addEventListener('input', (e) => this.autoFill(modal.querySelector('#e-speaker').value, e.target.value));

        modal.querySelector('#event-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
        });
    },

    sharePreview(id) {
        const event = State.outgoing.find(e => e.id === id);
        if (event) {
            window.router.navigate('reports');
            setTimeout(() => {
                document.getElementById('filter-start').value = event.date;
                document.getElementById('filter-end').value = event.date;
                document.getElementById('filter-type').value = 'Van';
                document.getElementById('btn-filter').click();
                window.showToast('Previsualización de salida lista', 'info');
            }, 500);
        }
    },

    autoFill(speakerId, outline = null) {
        if (!speakerId) return;
        const speaker = State.authorized.find(s => s.id === speakerId);
        if (!speaker) return;

        if (outline) {
            const talk = speaker.talks.find(t => t.outline === outline);
            if (talk) {
                document.getElementById('e-title').value = talk.title;
                document.getElementById('e-song').value = talk.song || '';
            }
        } else {
            // If only speaker changed, find the first talk
            if (speaker.talks.length === 1) {
                document.getElementById('e-outline').value = speaker.talks[0].outline;
                document.getElementById('e-title').value = speaker.talks[0].title;
                document.getElementById('e-song').value = speaker.talks[0].song || '';
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
            song_number: document.getElementById('e-song').value,
            date: document.getElementById('e-date').value,
            time: document.getElementById('e-time').value,
            comments: document.getElementById('e-comments').value
        };

        const result = EventService.saveOutgoing(data);

        if (result.success) {
            document.getElementById('modal-container').classList.add('hidden');
            this.renderList(document.querySelector('.event-list'), State.outgoing);
            window.showToast('Salida guardada', 'success');
        } else if (result.message) {
            window.showToast(result.message, 'warning');
        }
    }
};

window.Outgoing = Outgoing;
