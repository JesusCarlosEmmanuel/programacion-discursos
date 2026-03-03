import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';
import { EventService } from '../services/EventService.js';

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
        const dateObj = new Date(e.date + 'T12:00:00');
        const dayName = dayNames[dateObj.getDay()];

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
        EventService.deleteEvents('incoming', ids, () => {
            if (document.querySelector('.event-list')) {
                this.renderList(document.querySelector('.event-list'), State.incoming);
            }
        });
        this.renderList(document.querySelector('.event-list'), State.incoming);
    },

    showModal(id = null) {
        const event = id ? State.incoming.find(e => e.id === id) : {
            speaker_name: '', speaker_phone: '', congregation_origin: '', outline_number: '', talk_title: '', song_number: '', date: '', time: '12:00', contact_secondary: '', comments: ''
        };

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        // Find congregation info to show contacts if available
        const originCong = State.origins.find(o => o.name === event.congregation_origin);

        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>${id ? 'Editar' : 'Programar'} Visita</h3>
                    ${id ? `<button class="btn btn-secondary btn-small" onclick="Incoming.sharePreview('${id}')"><i data-lucide="image"></i> Generar Confirmación</button>` : ''}
                </div>
                <form id="event-form">
                    <div class="form-section-title">Datos del Discursante</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre (Visitante)</label>
                            <input type="text" id="e-name" value="${event.speaker_name}" required>
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="e-phone" value="${event.speaker_phone}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Congregación de Origen</label>
                        <input type="text" id="e-origin" list="origin-list" value="${event.congregation_origin}" required placeholder="Buscar o escribir...">
                        <datalist id="origin-list">
                            ${State.origins.map(o => `<option value="${o.name}">`).join('')}
                        </datalist>
                        ${originCong ? `<p class="hint-text">Contacto: ${originCong.contact_name} (${originCong.contact_phone})</p>` : ''}
                    </div>

                    <div class="form-section-title">Detalles del Discurso</div>
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
                        <label>Notas adicionales</label>
                        <textarea id="e-comments" placeholder="Ej: Necesita transporte, dieta especial, etc.">${event.comments || ''}</textarea>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">${id ? 'Actualizar' : 'Agendar Visita'}</button>
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

    sharePreview(id) {
        // This will navigate to reports with this specific event filtered
        const event = State.incoming.find(e => e.id === id);
        if (event) {
            window.router.navigate('reports');
            setTimeout(() => {
                document.getElementById('filter-start').value = event.date;
                document.getElementById('filter-end').value = event.date;
                document.getElementById('filter-type').value = 'Viene';
                document.getElementById('btn-filter').click();
                window.showToast('Previsualización lista para compartir', 'info');
            }, 500);
        }
    },

    handleSave(id) {
        const data = {
            id: id || crypto.randomUUID(),
            speaker_name: document.getElementById('e-name').value,
            speaker_phone: PhoneUtils.validate(document.getElementById('e-phone').value),
            congregation_origin: document.getElementById('e-origin').value,
            outline_number: document.getElementById('e-outline').value,
            talk_title: document.getElementById('e-title').value,
            song_number: document.getElementById('e-song').value,
            date: document.getElementById('e-date').value,
            time: document.getElementById('e-time').value,
            comments: document.getElementById('e-comments').value
        };

        const result = EventService.saveIncoming(data);

        if (result.success) {
            document.getElementById('modal-container').classList.add('hidden');
            this.renderList(document.querySelector('.event-list'), State.incoming);
            window.showToast('Visita guardada', 'success');
        } else if (result.message) {
            window.showToast(result.message, 'warning');
        }
    }
};

window.Incoming = Incoming;
