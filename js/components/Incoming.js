import { State } from '../context/state.js';

export const Incoming = {
    render() {
        const container = document.createElement('div');
        container.className = 'incoming-view';

        container.innerHTML = `
            <div class="view-header">
                <h2>Discursantes que Vienen</h2>
                <button class="btn btn-primary" id="btn-add-incoming">
                    <i data-lucide="plus"></i> Agendar Visita
                </button>
            </div>

            <div class="event-list">
                ${State.incoming.length > 0 ? this.renderList(State.incoming) : '<p class="empty-state">No hay visitas programadas.</p>'}
            </div>
        `;

        container.querySelector('#btn-add-incoming').addEventListener('click', () => this.showIncomingModal());

        return container;
    },

    renderList(events) {
        return events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => {
            return `
                <div class="card event-card">
                    <div class="event-main">
                        <span class="event-date">${event.date} • ${event.time}</span>
                        <h4>${event.speaker_name}</h4>
                        <p class="event-sub">De: <strong>${event.congregation_origin}</strong></p>
                        <p class="event-detail">Discurso: ${event.talk_title} (#${event.outline_number})</p>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="if(confirm('¿Eliminar?')) { window.deleteEvent('incoming', '${event.id}') }">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
        }).join('');
    },

    showIncomingModal() {
        const modal = document.getElementById('modal-container');

        modal.innerHTML = `
            <div class="modal-content card">
                <h3>Agendar Visita</h3>
                <form id="incoming-form">
                    <div class="form-group">
                        <label>Nombre del Discursante</label>
                        <input type="text" id="in-speaker-name" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono</label>
                        <input type="tel" id="in-speaker-phone" required>
                    </div>
                    <div class="form-group">
                        <label>Congregación de Origen</label>
                        <input type="text" id="in-cong-origin" required>
                    </div>
                    <div class="form-group-row" style="display:flex; gap:10px">
                         <div style="flex:1">
                            <label>Bosquejo #</label>
                            <input type="text" id="in-outline" required>
                        </div>
                        <div style="flex:2">
                            <label>Cántico</label>
                            <input type="text" id="in-song" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Título del Discurso</label>
                        <input type="text" id="in-title" required>
                    </div>
                    <div class="form-group-row" style="display:flex; gap:10px">
                        <div style="flex:1">
                            <label>Fecha</label>
                            <input type="date" id="in-date" required>
                        </div>
                        <div style="flex:1">
                            <label>Horario</label>
                            <input type="time" id="in-time" required>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="in-cancel">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Agendar</button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();

        modal.querySelector('#in-cancel').addEventListener('click', () => modal.classList.add('hidden'));
        modal.querySelector('#incoming-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
    },

    handleSave() {
        const name = document.getElementById('in-speaker-name').value;
        const phone = document.getElementById('in-speaker-phone').value;
        const cong = document.getElementById('in-cong-origin').value;
        const outline = document.getElementById('in-outline').value;
        const song = document.getElementById('in-song').value;
        const title = document.getElementById('in-title').value;
        const date = document.getElementById('in-date').value;
        const time = document.getElementById('in-time').value;

        // 3-month repetition check
        const newDate = new Date(date);
        const repetition = State.incoming.find(e => {
            const eDate = new Date(e.date);
            const diffMonths = Math.abs((newDate.getFullYear() - eDate.getFullYear()) * 12 + (newDate.getMonth() - eDate.getMonth()));
            return diffMonths < 3 && (e.outline_number === outline || e.talk_title === title);
        });

        if (repetition) {
            const confirmSave = confirm(`ALERTA: Este discurso (#${outline} - ${title}) ya se presentó el ${repetition.date} (hace menos de 3 meses). ¿Deseas continuar?`);
            if (!confirmSave) return;
        }

        const newEvent = {
            id: crypto.randomUUID(),
            speaker_name: name,
            speaker_phone: phone,
            congregation_origin: cong,
            outline_number: outline,
            talk_title: title,
            song_number: song,
            date,
            time
        };

        State.addIncomingEvent(newEvent);
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('nav-incoming').click();
        window.showToast('Visita agendada', 'success');
    }
};
