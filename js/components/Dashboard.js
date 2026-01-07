import { State } from '../context/state.js';

export const Dashboard = {
    render() {
        const container = document.createElement('div');
        container.className = 'dashboard';

        const stats = this.getStats();
        const alerts = this.getUpcomingAlerts();

        container.innerHTML = `
    < div class="view-header" >
                <h2>Panel de Control</h2>
                <div class="congregation-badge">
                    <i data-lucide="home"></i> ${State.congregation?.name || 'Congregación Local'}
                </div>
            </div >

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

        this.initAutomation(container);
        if (window.lucide) window.lucide.createIcons();
        return container;
    },

    getUpcomingAlerts() {
        const now = new Date();
        const tenDaysLater = new Date();
        tenDaysLater.setDate(now.getDate() + 10);

        const outgoing = State.outgoing.map(e => ({ ...e, type: 'outgoing' }));
        const incoming = State.incoming.map(e => ({ ...e, type: 'incoming' }));

        return [...outgoing, ...incoming]
            .filter(e => {
                const eventDate = new Date(e.date);
                return eventDate >= now && eventDate <= tenDaysLater;
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    renderAlertCard(alert) {
        const isOutgoing = alert.type === 'outgoing';
        const daysLeft = Math.ceil((new Date(alert.date) - new Date()) / (1000 * 60 * 60 * 24));
        const isUrgent = daysLeft < 4;
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dayName = dayNames[new Date(alert.date).getDay()];

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
        const event = type === 'outgoing'
            ? State.outgoing.find(e => e.id === id)
            : State.incoming.find(e => e.id === id);

        const isOutgoing = type === 'outgoing';
        const speaker = isOutgoing
            ? State.authorized.find(s => s.id === event.speaker_id)
            : { name: event.speaker_name, phone: event.speaker_phone };

        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const dayName = dayNames[new Date(event.date).getDay()];
        const local = State.congregation;
        const greeting = this.getGreeting();

        let message = "";
        let phone = speaker.phone;

        if (isOutgoing) {
            if (target === 'speaker') {
                message = `${greeting} hermano ${speaker.name}, te recordamos tu discurso para este próximo ${dayName} ${event.date} en la congregación "${event.destination_congregation}" a las ${event.time}. El bosquejo es el #${event.outline_number} "${event.talk_title}". ¡Mucho éxito!\n\nAtte: ${local.name || 'Congregación Local'}`;
            } else {
                // To Destination Coordinator
                const dest = State.destinations.find(d => d.name === event.destination_congregation);
                phone = dest?.phone || '';
                message = `${greeting} hermano Coordinador de la Cong. ${event.destination_congregation}, te confirmo que el hno. ${speaker.name} (${speaker.phone}) asistirá con ustedes este próximo ${dayName} ${event.date} a las ${event.time}. Presentará el bosquejo #${event.outline_number} "${event.talk_title}".\n\nSaludos de la Cong. ${local.name || ''}.`;
            }
        } else {
            // Incoming to Visiting Speaker
            message = `${greeting} hermano ${speaker.name}, te recordamos que te esperamos este próximo ${dayName} ${event.date} a las ${event.time} en nuestra congregación "${local.name || ''}".\n\nDirección: ${local.address || '---'}\n\nEl tema es #${event.outline_number} "${event.talk_title}".\n\nContacto local: ${local.scheduler?.name || ''} (${local.scheduler?.phone || ''}).`;
        }

        if (!phone) {
            window.showToast('No se encontró el teléfono del contacto', 'warning');
            return;
        }

        const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    initAutomation(container) {
        // Request notification permission
        if ("Notification" in window && Notification.permission === "default") {
            setTimeout(() => {
                Notification.requestPermission();
            }, 3000);
        }

        // Setup the 8:30 AM logic (simulated by checking on load)
        const now = new Date();
        const lastCheck = localStorage.getItem('last_auto_check');
        const todayStr = now.toISOString().split('T')[0];

        if (lastCheck !== todayStr && now.getHours() >= 8) {
            const alerts = this.getUpcomingAlerts();
            const relevant = alerts.filter(a => {
                const diff = Math.ceil((new Date(a.date) - now) / (1000 * 60 * 60 * 24));
                // 10-day one-time notification check
                return diff === 10 && !a.notif_sent;
            });

            if (relevant.length > 0 && Notification.permission === "granted") {
                new Notification("Recordatorios de Discursos", {
                    body: `Tienes ${relevant.length} recordatorios de 10 días para enviar hoy.`,
                    icon: '/favicon.ico'
                });

                // Mark as sent in state
                relevant.forEach(a => {
                    if (a.type === 'outgoing') {
                        const idx = State.outgoing.findIndex(e => e.id === a.id);
                        if (idx !== -1) State.outgoing[idx].notif_sent = true;
                    } else {
                        const idx = State.incoming.findIndex(e => e.id === a.id);
                        if (idx !== -1) State.incoming[idx].notif_sent = true;
                    }
                });
                State.saveToStorage('speaker_app_outgoing', State.outgoing);
                State.saveToStorage('speaker_app_incoming', State.incoming);
            }
            localStorage.setItem('last_auto_check', todayStr);
        }
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Hola, buen día";
        if (hour >= 12 && hour < 19) return "Hola, buena tarde";
        return "Hola, buena noche";
    }
};
