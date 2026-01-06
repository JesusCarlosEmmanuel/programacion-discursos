import { State } from '../context/state.js';

export const Outgoing = {
    render() {
        const container = document.createElement('div');
        container.className = 'outgoing-view';

        container.innerHTML = `
            <div class="view-header">
                <h2>Discursantes que Van</h2>
                <button class="btn btn-primary" id="btn-add-outgoing">
                    <i data-lucide="plus"></i> Agendar Salida
                </button>
            </div>

            <div class="event-list">
                ${State.outgoing.length > 0 ? this.renderList(State.outgoing) : '<p class="empty-state">No hay salidas programadas.</p>'}
            </div>
        `;

        container.querySelector('#btn-add-outgoing').addEventListener('click', () => this.showOutgoingModal());

        return container;
    },

    renderList(events) {
        return events.sort((a, b) => new Date(a.date) - new Date(b.date)).map(event => {
            const speaker = State.authorized.find(s => s.id === event.speaker_id);
            const talk = speaker ? speaker.talks.find(t => t.title === event.talk_title) : null;
            return `
                <div class="card event-card">
                    <div class="event-main">
                        <span class="event-date">${event.date} • ${event.time}</span>
                        <h4>${speaker ? speaker.name : 'Desconocido'}</h4>
                        <p class="event-sub">Destino: <strong>${event.destination_congregation}</strong></p>
                        <p class="event-detail">Discurso: ${event.talk_title} (#${event.outline_number})</p>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="if(confirm('¿Eliminar?')) { window.deleteEvent('outgoing', '${event.id}') }">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
        }).join('');
    },

    showOutgoingModal() {
        const modal = document.getElementById('modal-container');

        modal.innerHTML = `
            <div class="modal-content card">
                <h3>Agendar Salida</h3>
                <form id="outgoing-form">
                    <div class="form-group">
                        <label>Discursante Autorizado</label>
                        <select id="out-speaker-id" required>
                            <option value="">Seleccione...</option>
                            ${State.authorized.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Seleccionar Discurso</label>
                        <select id="out-talk-id" required disabled>
                            <option value="">Primero elija discursante...</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Congregación Destino</label>
                        <input type="text" id="out-dest-cong" required>
                    </div>

                    <div class="form-group">
                        <label>Fecha</label>
                        <input type="date" id="out-date" required>
                    </div>

                    <div class="form-group group-row">
                        <div style="flex:1">
                            <label>Horario</label>
                            <input type="time" id="out-time" required>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="out-cancel">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Agendar</button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();

        const speakerSelect = modal.querySelector('#out-speaker-id');
        const talkSelect = modal.querySelector('#out-talk-id');

        speakerSelect.addEventListener('change', (e) => {
            const speaker = State.authorized.find(s => s.id === e.target.value);
            if (speaker) {
                talkSelect.disabled = false;
                talkSelect.innerHTML = speaker.talks.map((t, i) => `<option value="${i}" data-outline="${t.outline}" data-title="${t.title}">${t.outline} - ${t.title}</option>`).join('');
            } else {
                talkSelect.disabled = true;
                talkSelect.innerHTML = '<option value="">Seleccione...</option>';
            }
        });

        modal.querySelector('#out-cancel').addEventListener('click', () => modal.classList.add('hidden'));
        modal.querySelector('#outgoing-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave();
        });
    },

    async handleSave() {
        const speakerId = document.getElementById('out-speaker-id').value;
        const talkIndex = document.getElementById('out-talk-id').value;
        const date = document.getElementById('out-date').value;
        const destCong = document.getElementById('out-dest-cong').value;
        const time = document.getElementById('out-time').value;

        const dateObj = new Date(date);
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        // 1/month validation
        const alreadyScheduled = State.outgoing.find(e => {
            const eDate = new Date(e.date);
            return e.speaker_id === speakerId && eDate.getMonth() === month && eDate.getFullYear() === year;
        });

        if (alreadyScheduled) {
            const confirmSave = confirm(`AVERTENCIA: El discursante ya tiene una salida agendada para este mes. ¿Deseas continuar de todos modos?`);
            if (!confirmSave) return;
        }

        const speaker = State.authorized.find(s => s.id === speakerId);
        const talk = speaker.talks[talkIndex];

        const newEvent = {
            id: crypto.randomUUID(),
            speaker_id: speakerId,
            outline_number: talk.outline,
            talk_title: talk.title,
            destination_congregation: destCong,
            date,
            time
        };

        State.addOutgoingEvent(newEvent);
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('nav-outgoing').click();
        window.showToast('Salida agendada', 'success');
    }
};

window.deleteEvent = (type, id) => {
    State.deleteEvent(type, id);
    document.getElementById(`nav-${type}`).click();
};
