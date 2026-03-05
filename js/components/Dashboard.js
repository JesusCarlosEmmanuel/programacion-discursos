import { State } from '../context/state.js';
import { NotificationService } from '../services/NotificationService.js';

export const Dashboard = {
    render() {
        const container = document.createElement('div');
        container.className = 'dashboard';

        const stats = this.getStats();
        const alerts = this.getUpcomingAlerts();

        container.innerHTML = `
            <div class="view-header" style="justify-content: space-between; align-items: flex-start;">
                <h1 style="font-size: 2rem; font-weight: 800;">Panel de Control</h1>
                <div class="congregation-badge" style="background: transparent; border: none; padding: 0;">
                    <i data-lucide="home" style="color: white; width: 24px; height: 24px;"></i> 
                    <span style="font-size: 1.2rem; font-weight: 600;">${State.congregation?.name || 'Congregación Local'}</span>
                </div>
            </div>

            <div class="stats-grid" style="margin-top: 2rem;">
                <div class="stat-card neon-card-pink" onclick="window.router.navigate('outgoing?filter=recent')" style="cursor: pointer;">
                    <span class="stat-value">${stats.outgoing}</span>
                    <span class="stat-label">SALIDAS (VAN)</span>
                </div>
                <div class="stat-card neon-card-purple" onclick="window.router.navigate('incoming?filter=recent')" style="cursor: pointer;">
                    <span class="stat-value">${stats.incoming}</span>
                    <span class="stat-label">VISITAS (VIENEN)</span>
                </div>
                <div class="stat-card neon-card-blue" onclick="window.router.navigate('authorized')" style="cursor: pointer;">
                    <span class="stat-value">${stats.totalSpeakers}</span>
                    <span class="stat-label">DISCURSANTES</span>
                </div>
            </div>

            <section class="alerts-section" style="margin-top: 3rem;">
                <h3 style="display: flex; align-items: center; gap: 10px; font-size: 1.4rem;">
                    <i data-lucide="bell"></i> Alertas Próximas (10 días)
                </h3>
                <div id="alerts-list" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
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
        this.checkNewYear();
        if (window.lucide) window.lucide.createIcons();
        return container;
    },

    checkNewYear() {
        const currentYear = new Date().getFullYear();
        const lastYearChecked = localStorage.getItem('last_year_checked');
        if (lastYearChecked && parseInt(lastYearChecked) < currentYear) {
            // It's a new year
            setTimeout(() => {
                if (confirm(`¡Feliz ${currentYear}! Recuerda que al iniciar el año los horarios de las congregaciones pueden cambiar. ¿Deseas revisar y actualizar el horario de tu congregación ahora?`)) {
                    window.router.navigate('data');
                }
            }, 2000);
        }
        localStorage.setItem('last_year_checked', currentYear.toString());
    },

    getStats() {
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const recentOutgoing = State.outgoing.filter(e => new Date(e.date + 'T12:00:00') >= sixtyDaysAgo);
        const recentIncoming = State.incoming.filter(e => new Date(e.date + 'T12:00:00') >= sixtyDaysAgo);

        return {
            outgoing: recentOutgoing.length,
            incoming: recentIncoming.length,
            totalSpeakers: State.authorized.length
        };
    },

    formatDisplayDate(isoDate) {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${d}-${m}-${y}`;
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
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return eventDate >= today && eventDate <= tenDaysLater;
            });

        // Gap alert logic (Only for the local meeting day)
        const gapAlerts = [];
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(now.getDate() + 30);

        const localMeetingDay = State.congregation?.meetingDay || 'Domingo';
        const targetDayNum = localMeetingDay === 'Sábado' ? 6 : 0;

        for (let d = new Date(now); d <= thirtyDaysLater; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek === targetDayNum) {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;

                const hasIncoming = State.incoming.some(e => e.date === dateStr);
                const hasOutgoing = State.outgoing.some(e => e.date === dateStr);

                if (!hasIncoming && !hasOutgoing) {
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

        // Return gap alerts only for the next 4 weekends
        return [...gapAlerts.slice(0, 4), ...realAlerts].sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    renderAlertCard(alert) {
        const dayNamesSpan = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dateObj = new Date(alert.date + 'T12:00:00');
        const dayName = dayNamesSpan[dateObj.getDay()];
        const displayDate = this.formatDisplayDate(alert.date);

        if (alert.type === 'gap') {
            return `
                <div class="card alert-card gap-card" style="border-left: 5px solid #ff7b7b; padding: 1.5rem; background: rgba(30,30,50,0.5); border-radius: 20px;">
                    <div class="alert-info">
                        <div class="alert-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
                            <span class="badge" style="background:#ff5c5c; color:white; font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; font-weight: 800;">
                                Vacío
                            </span>
                            <span class="alert-date" style="color:#ff7b7b; font-size: 1.2rem; font-weight: 800;">
                                ${dayName} ${displayDate}
                            </span>
                        </div>
                        <h2 style="font-size: 1.6rem; font-weight: 900; letter-spacing: 1px; margin: 0.5rem 0;">FIN DE SEMANA LIBRE</h2>
                        <p style="color:#ff7b7b; font-size: 1.1rem;">No hay discursante programado para el ${dayName.toLowerCase()} ${displayDate}.</p>
                    </div>
                    <div class="alert-actions">
                        <button class="btn btn-secondary" onclick="window.router.navigate('incoming')" style="border-radius: 12px; display: flex; align-items: center; gap: 8px; font-weight: 600; background: rgba(255,255,255,0.05);">
                            <i data-lucide="plus-circle" style="width:18px"></i> Agendar Ahora
                        </button>
                    </div>
                </div>
            `;
        }

        const isOutgoing = alert.type === 'outgoing';
        const speaker = isOutgoing
            ? State.authorized.find(s => s.id === alert.speaker_id)
            : { name: alert.speaker_name, phone: alert.speaker_phone };

        return `
            <div class="card alert-card" style="border-left: 5px solid ${isOutgoing ? '#6366f1' : '#f472b6'}; padding: 1.5rem; background: rgba(30,30,50,0.5); border-radius: 20px;">
                <div class="alert-info">
                    <div class="alert-header" style="display: flex; align-items: center; gap: 10px; margin-bottom: 0.5rem;">
                        <span class="badge" style="background:${isOutgoing ? '#6366f1' : '#f472b6'}; color:white; font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; font-weight: 800;">
                            ${isOutgoing ? 'Salida' : 'Visita'}
                        </span>
                        <span class="alert-date" style="color:white; font-size: 1.2rem; font-weight: 800;">
                            ${dayName} ${displayDate} - ${alert.time}
                        </span>
                    </div>
                    <h2 style="font-size: 1.6rem; font-weight: 900; letter-spacing: 1px; margin: 0.5rem 0;">${speaker?.name || 'Desconocido'}</h2>
                    <p style="font-size: 1.1rem; color: #94a3b8;">#${alert.outline_number} ${alert.talk_title}</p>
                    <p class="location" style="margin-top: 5px; color: #94a3b8;"><i data-lucide="map-pin" style="width:14px"></i> ${isOutgoing ? alert.destination_congregation : 'Local'}</p>
                </div>
                <div class="alert-actions" style="display:flex; flex-direction:column; gap:8px">
                    <button class="btn btn-secondary btn-small" onclick="Dashboard.openWhatsApp('${alert.type}', '${alert.id}', 'speaker')">
                        <i data-lucide="message-circle" style="width:14px"></i> Recordar
                    </button>
                    ${isOutgoing ? `
                    <button class="btn btn-secondary btn-small" onclick="Dashboard.openWhatsApp('${alert.type}', '${alert.id}', 'coordinator')">
                        <i data-lucide="send" style="width:14px"></i> Avisar Coord.
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

