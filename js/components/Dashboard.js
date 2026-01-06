import { State } from '../context/state.js';

export const Dashboard = {
    render() {
        const container = document.createElement('div');
        container.className = 'dashboard-view';

        const alerts = this.getAlerts();

        container.innerHTML = `
            <section class="welcome-section">
                <h2>Hola de nuevo,</h2>
                <p>Aquí tienes el resumen de actividades.</p>
            </section>

            <section class="alerts-section">
                <h3 class="section-title">Alertas (Próximos 10 días)</h3>
                <div class="alerts-list">
                    ${alerts.length > 0 ? alerts.map(alert => this.renderAlertCard(alert)).join('') : '<p class="empty-state">No hay alertas pendientes.</p>'}
                </div>
            </section>

            <section class="quick-stats">
                <div class="stat-card">
                    <span class="stat-value">${State.outgoing.length}</span>
                    <span class="stat-label">Salidas</span>
                </div>
                <div class="stat-card">
                    <span class="stat-value">${State.incoming.length}</span>
                    <span class="stat-label">Visitas</span>
                </div>
            </section>
        `;

        // Add event listeners for WhatsApp buttons
        container.querySelectorAll('.btn-whatsapp').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const phone = e.currentTarget.getAttribute('data-phone');
                const msg = e.currentTarget.getAttribute('data-msg');
                this.sendWhatsApp(phone, msg);
            });
        });

        return container;
    },

    getAlerts() {
        const today = new Date();
        const tenDaysFromNow = new Date();
        tenDaysFromNow.setDate(today.getDate() + 10);

        const allEvents = [
            ...State.outgoing.map(e => ({ ...e, type: 'outgoing' })),
            ...State.incoming.map(e => ({ ...e, type: 'incoming' }))
        ];

        return allEvents.filter(e => {
            const eventDate = new Date(e.date);
            const diffTime = eventDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 10 && diffDays >= 0;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    renderAlertCard(event) {
        const isOutgoing = event.type === 'outgoing';
        const speaker = isOutgoing ? State.authorized.find(s => s.id === event.speaker_id) : { name: event.speaker_name, phone: event.speaker_phone };

        if (!speaker) return '';

        const msg = isOutgoing
            ? `Hola ${speaker.name}, recordatorio de tu discurso en la congregación ${event.destination_congregation} el ${event.date} a las ${event.time}.`
            : `Hola ${speaker.name}, te recordamos tu visita a nuestra congregación el ${event.date} a las ${event.time}.`;

        return `
            <div class="card alert-card ${isOutgoing ? 'border-outgoing' : 'border-incoming'}">
                <div class="alert-info">
                    <span class="tag ${isOutgoing ? 'tag-out' : 'tag-in'}">${isOutgoing ? 'SALIDA' : 'VISITA'}</span>
                    <h4>${speaker.name}</h4>
                    <p>${event.date} • ${event.time}</p>
                    <p class="destination">${isOutgoing ? 'Destino: ' + event.destination_congregation : 'Origen: ' + event.congregation_origin}</p>
                </div>
                <button class="btn btn-whatsapp" data-phone="${speaker.phone}" data-msg="${msg}">
                    <i data-lucide="message-circle"></i>
                    WhatsApp
                </button>
            </div>
        `;
    },

    sendWhatsApp(phone, message) {
        const cleanPhone = phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }
};
