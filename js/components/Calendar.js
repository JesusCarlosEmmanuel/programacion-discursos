import { State } from '../context/state.js';

export const Calendar = {
    currentDate: new Date(),

    render() {
        const container = document.createElement('div');
        container.className = 'calendar-view';

        container.innerHTML = `
            <div class="view-header">
                <h2>Calendario Mensual</h2>
                <div class="calendar-controls">
                    <button class="btn btn-icon" id="btn-prev-month"><i data-lucide="chevron-left"></i></button>
                    <h3 id="calendar-month-title"></h3>
                    <button class="btn btn-icon" id="btn-next-month"><i data-lucide="chevron-right"></i></button>
                </div>
            </div>

            <div class="calendar-grid" id="calendar-grid">
                <!-- Blocks injected here -->
            </div>

            <!-- Modal for details -->
            <div id="calendar-modal" class="modal-overlay hidden">
                <div class="modal-content card" id="calendar-modal-content"></div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        container.querySelector('#btn-prev-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.updateCalendar(container);
        });

        container.querySelector('#btn-next-month').addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.updateCalendar(container);
        });

        const modal = container.querySelector('#calendar-modal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });

        // Initial render
        this.updateCalendar(container);

        return container;
    },

    updateCalendar(container) {
        const titleEl = container.querySelector('#calendar-month-title');
        const gridEl = container.querySelector('#calendar-grid');

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        titleEl.textContent = `${monthNames[month]} ${year}`;

        // Discover meeting day
        const localDayMap = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
        const meetingDayName = State.congregation?.meeting_day || 'Domingo';
        const meetingDayIndex = localDayMap[meetingDayName] !== undefined ? localDayMap[meetingDayName] : 0;

        // Get all dates for the meeting day in this month
        const dates = [];
        let d = new Date(year, month, 1);
        while (d.getMonth() === month) {
            if (d.getDay() === meetingDayIndex) {
                dates.push(new Date(d));
            }
            d.setDate(d.getDate() + 1);
        }

        gridEl.innerHTML = dates.map(date => {
            const dateStr = date.toISOString().split('T')[0];
            const incomingEvent = State.incoming.find(e => e.date === dateStr);
            const isAssigned = !!incomingEvent;

            return `
                <div class="calendar-block ${isAssigned ? 'assigned' : 'vacant'}" data-date="${dateStr}" data-assigned="${isAssigned}">
                    <div class="block-date">${date.getDate()}</div>
                    <div class="block-status">
                        ${isAssigned ? '<i data-lucide="check-circle"></i> Asignado' : '<i data-lucide="alert-circle"></i> Vacío'}
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();

        // Add events
        gridEl.querySelectorAll('.calendar-block').forEach(block => {
            block.addEventListener('click', () => this.showModal(container, block.dataset));
        });
    },

    showModal(container, dataset) {
        const { date, assigned } = dataset;
        const isAssigned = assigned === 'true';
        const modal = container.querySelector('#calendar-modal');
        const content = container.querySelector('#calendar-modal-content');

        if (isAssigned) {
            const e = State.incoming.find(ev => ev.date === date);
            const origin = State.origins.find(o => o.name === e.congregation_origin) || {};

            content.innerHTML = `
                <div class="modal-header">
                    <h3>Visita Programada</h3>
                    <button class="btn btn-icon btn-small" onclick="document.getElementById('calendar-modal').classList.add('hidden')"><i data-lucide="x"></i></button>
                </div>
                <div class="calendar-details-card">
                    <p><strong>Discursante:</strong> ${e.speaker_name}</p>
                    <p><strong>Congregación:</strong> ${e.congregation_origin}</p>
                    <p><strong>Fecha:</strong> ${e.date}</p>
                    <p><strong>Horario:</strong> ${e.time}</p>
                    <p><strong>Tema:</strong> #${e.outline_number} - ${e.talk_title}</p>
                    <div style="margin-top: 15px;">
                        <a href="tel:${e.speaker_phone}" class="btn btn-primary" style="text-decoration: none; display: inline-block; text-align: center;"><i data-lucide="phone"></i> Llamar</a>
                        <a href="https://wa.me/${e.speaker_phone.replace(/\D/g, '')}" target="_blank" class="btn btn-secondary" style="text-decoration: none; display: inline-block; text-align: center;"><i data-lucide="message-square"></i> WhatsApp</a>
                    </div>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="modal-header">
                    <h3>Fin de semana disponible</h3>
                    <button class="btn btn-icon btn-small" onclick="document.getElementById('calendar-modal').classList.add('hidden')"><i data-lucide="x"></i></button>
                </div>
                <div class="calendar-details-card" style="text-align: center; padding: 20px;">
                    <i data-lucide="calendar-x" style="width: 48px; height: 48px; color: var(--danger); margin-bottom: 10px;"></i>
                    <p style="margin-bottom: 20px;">No tienes discursante agendado para el <strong>${date}</strong>.</p>
                    <button class="btn btn-primary" onclick="window.router.navigate('incoming'); document.getElementById('calendar-modal').classList.add('hidden');">Agendar Ahora</button>
                </div>
            `;
        }

        if (window.lucide) window.lucide.createIcons();
        modal.classList.remove('hidden');
    }
};
