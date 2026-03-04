import { State } from '../context/state.js';
import { NotificationService } from '../services/NotificationService.js';

export const Dashboard = {
    render() {
        const container = document.createElement('div');
        container.className = 'dashboard';

        const stats = this.getStats();
        const alerts = this.getUpcomingAlerts();

        container.innerHTML = `
            <div class="view-header">
                <h2>Panel de Control</h2>
                <div class="congregation-badge">
                    <i data-lucide="home"></i> ${State.congregation?.name || 'Congregación Local'}
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-value">${stats.outgoing}</span>
                    <span class="stat-label">Salidas (Van)</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.incoming}</span>
                    <span class="stat-label">Visitas (Vienen)</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${stats.totalSpeakers}</span>
                    <span class="stat-label">Discursantes</span>
                </div>
            </div>

            <section class="alerts-section">
                <h3><i data-lucide="bell"></i> Alertas Próximas (10 días)</h3>
                <div id="alerts-list">
                    ${alerts.length === 0 ? `
                        <div class="empty-state">
                            <i data-lucide="check-circle"></i>
                            <p>No hay eventos próximos en los siguientes 10 días.</p>
                        </div>
                    ` : alerts.map(alert => this.renderAlertCard(alert)).join('')}
                </div>
            </section>
`;

        NotificationService.checkAutomatedAlerts();
        if (window.lucide) window.lucide.createIcons();
        return container;
    },

    getStats() {
        return {
            outgoing: State.outgoing.length,
            incoming: State.incoming.length,
            totalSpeakers: State.authorized.length
        };
    },

    getUpcomingAlerts() {
        const now = new Date();
        const tenDaysLater = new Date();
        tenDaysLater.setDate(now.getDate() + 10);

        const outgoing = State.outgoing.map(e => ({ ...e, type: 'outgoing' }));
        const incoming = State.incoming.map(e => ({ ...e, type: 'incoming' }));

        const realAlerts = [...outgoing, ...incoming]
            .filter(e => {
                const eventDate = new Date(e.date + 'T12:00:00');
                return eventDate >= now && eventDate <= tenDaysLater;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // 30-day Missing Weekend alert
        const gapAlerts = [];
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        const localDayMap = { 'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6 };
        const meetingDayName = State.congregation?.meeting_day || 'Domingo';
        const meetingDayIndex = localDayMap[meetingDayName];

        // Ensure we handle weekends properly if the user meeting day is set
        const dayCheck = meetingDayIndex !== undefined ? meetingDayIndex : 0;

        for (let d = new Date(now); d <= thirtyDaysLater; d.setDate(d.getDate() + 1)) {
            if (d.getDay() === dayCheck) {
                const dateStr = d.toISOString().split('T')[0];
                const hasIncoming = State.incoming.some(e => e.date === dateStr);
                if (!hasIncoming) {
                    gapAlerts.push({
                        id: 'gap-' + dateStr,
                        type: 'gap',
                        date: dateStr,
                        speaker_name: 'SIN ASIGNAR',
                        talk_title: 'Se requiere acción inmediata',
                        outline_number: 'N/A'
                    });
                }
            }
        }

        // Combine and limit
        return [...gapAlerts.slice(0, 3), ...realAlerts].sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    renderAlertCard(alert) {
        if (alert.type === 'gap') {
            const dayNamesSpan = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const dayName = dayNamesSpan[new Date(alert.date + 'T12:00:00').getDay()];
            return `
                <div class="card alert-card card-urgent" data-type="gap">
                    <div class="alert-info">
                        <div class="alert-header">
                            <span class="badge" style="background:var(--danger); color:white">
                                Vacío
                            </span>
                            <span class="alert-date countdown-urgent">
                                ${dayName} ${alert.date}
                            </span>
                        </div>
                        <strong>FIN DE SEMANA LIBRE</strong>
                        <p class="talk-title" style="color:var(--danger)">No hay discursante programado.</p>
                    </div>
                    <div class="alert-actions" style="display:flex; flex-direction:column; gap:5px">
                        <button class="btn btn-secondary btn-small" onclick="document.getElementById('nav-incoming').click()">
                            <i data-lucide="plus-circle" style="width:14px"></i> Agendar Ahora
                        </button>
                    </div>
                </div>
            `;
        }

        const isOutgoing = alert.type === 'outgoing';
        const daysLeft = Math.ceil((new Date(alert.date + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysLeft < 4;
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = dayNames[new Date(alert.date + 'T12:00:00').getDay()];

        const speaker = isOutgoing
            ? State.authorized.find(s => s.id === alert.speaker_id)
            : { name: alert.speaker_name, phone: alert.speaker_phone };

        return `
            <div class="card alert-card ${isUrgent ? 'card-urgent' : ''}" data-type="${alert.type}">
                <div class="alert-info">
                    <div class="alert-header">
                        <span class="badge ${isOutgoing ? 'badge-outgoing' : 'badge-incoming'}">
                            ${isOutgoing ? 'Salida' : 'Visita'}
                        </span>
                        <span class="alert-date ${isUrgent ? 'countdown-urgent' : ''}">
                            ${dayName} ${alert.date} - ${alert.time}
                        </span>
                    </div>
                    <strong>${speaker?.name || 'Desconocido'}</strong>
                    <p class="talk-title">#${alert.outline_number} ${alert.talk_title}</p>
                    <p class="location"><i data-lucide="map-pin"></i> ${isOutgoing ? alert.destination_congregation : 'Local'}</p>
                </div>
                <div class="alert-actions" style="display:flex; flex-direction:column; gap:5px">
                    <button class="btn btn-secondary btn-small" onclick="Dashboard.openWhatsApp('${alert.type}', '${alert.id}', 'speaker')">
                        <i data-lucide="message-circle" style="width:14px"></i> Recordar Discursante
                    </button>
                    ${isOutgoing ? `
                    <button class="btn btn-secondary btn-small" onclick="Dashboard.openWhatsApp('${alert.type}', '${alert.id}', 'coordinator')">
                        <i data-lucide="send" style="width:14px"></i> Avisar Coordinador
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    openWhatsApp(type, id, target = 'speaker') {
        NotificationService.openWhatsApp(type, id, target);
    }
};

window.Dashboard = Dashboard;

