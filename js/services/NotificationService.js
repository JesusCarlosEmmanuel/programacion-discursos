import { State } from '../context/state.js';

export const NotificationService = {
    getGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Hola, buen día";
        if (hour >= 12 && hour < 19) return "Hola, buena tarde";
        return "Hola, buena noche";
    },

    /**
     * Opens WhatsApp with a pre-formatted message
     * @param {string} type 'outgoing' or 'incoming'
     * @param {string} eventId ID of the event
     * @param {string} target 'speaker' | 'coordinator' | 'coordinator2'
     */
    openWhatsApp(type, eventId, target = 'speaker') {
        const event = type === 'outgoing'
            ? State.outgoing.find(e => e.id === eventId)
            : State.incoming.find(e => e.id === eventId);

        if (!event) {
            window.showToast('Evento no encontrado', 'danger');
            return;
        }

        const isOutgoing = type === 'outgoing';
        const speaker = isOutgoing
            ? State.authorized.find(s => s.id === event.speaker_id)
            : { name: event.speaker_name, phone: event.speaker_phone };

        if (!speaker) {
            window.showToast('Discursante no encontrado', 'danger');
            return;
        }

        const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const dateObj = new Date(event.date + 'T12:00:00');
        const dayName = dayNames[dateObj.getDay()];
        const local = State.congregation || {};
        const greeting = this.getGreeting();

        let message = "";
        let phone = speaker.phone;

        if (isOutgoing) {
            const dest = State.destinations.find(d => d.name === event.destination_congregation);
            if (target === 'speaker') {
                message = `${greeting} hermano ${speaker.name}, te recordamos tu discurso programado para este próximo ${dayName} ${event.date} en la congregación "${event.destination_congregation}" a las ${event.time}. El bosquejo que presentarás es el #${event.outline_number} "${event.talk_title}". ¡Mucho éxito en tu asignación!\n\nAtte: ${local.name || 'Mi Congregación'}`;
            } else if (target === 'coordinator') {
                phone = dest?.contact_phone || '';
                message = `${greeting} hermano ${dest?.contact_name || 'Coordinador'}, te confirmo que el hermano ${speaker.name} (${speaker.phone}) asistirá con ustedes este próximo ${dayName} ${event.date} a las ${event.time}. Presentará el bosquejo #${event.outline_number} "${event.talk_title}"${event.song_number ? ` (Cántico ${event.song_number})` : ''}.\n\nSaludos fraternales de la Cong. ${local.name || ''}.`;
            } else if (target === 'coordinator2') {
                phone = dest?.contact2_phone || '';
                message = `${greeting} hermano ${dest?.contact2_name || 'Coordinador'}, te informo sobre el discurso del hermano ${speaker.name} programado para el ${event.date} en su congregación. Saludos.`;
            }
        } else {
            // Incoming
            message = `${greeting} hermano ${speaker.name}, te recordamos que te esperamos este próximo ${dayName} ${event.date} a las ${event.time} en nuestra congregación "${local.name || ''}".\n\nDirección: ${local.address || '---'}\n\nPresentarás el tema #${event.outline_number} "${event.talk_title}"${event.song_number ? ` (Cántico ${event.song_number})` : ''}.\n\nCualquier duda, tu contacto es: ${local.scheduler?.name || ''} (${local.scheduler?.phone || ''}). ¡Te esperamos!`;
        }

        if (!phone) {
            window.showToast('No se encontró el teléfono del contacto', 'warning');
            return;
        }

        const cleanPhone = phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    shareMonthlySummary(events) {
        if (events.length === 0) return;
        let message = `*PROGRAMACIÓN DE SALIDAS - PRÓXIMO MES*\n\n`;
        events.forEach(e => {
            const speaker = State.authorized.find(s => s.id === e.speaker_id);
            message += `📅 *${e.date}*\n🎙️ ${speaker?.name || '---'}\n📍 ${e.destination_congregation}\n📚 #${e.outline_number}\n\n`;
        });
        message += `_Por favor confirmar y prepararse con tiempo._`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    shareSupervisorReport(events, rangeText) {
        if (events.length === 0) return;
        let message = `*Reporte de Programación (${rangeText})*\n\n`;
        events.forEach(e => {
            const isOut = e.type === 'Van';
            const speaker = isOut ? (State.authorized.find(s => s.id === e.speaker_id)?.name || '---') : e.speaker_name;
            const cong = isOut ? e.destination_congregation : e.congregation_origin;
            message += `• ${e.date} | ${e.type}: ${speaker} | ${cong}\n`;
        });

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    checkAutomatedAlerts() {
        if ("Notification" in window && Notification.permission === "default") {
            setTimeout(() => {
                Notification.requestPermission();
            }, 3000);
        }

        const now = new Date();
        const lastCheck = localStorage.getItem('last_auto_check');
        const todayStr = now.toISOString().split('T')[0];

        if (lastCheck !== todayStr && now.getHours() >= 8) {
            const outgoing = State.outgoing.map(e => ({ ...e, type: 'outgoing' }));
            const incoming = State.incoming.map(e => ({ ...e, type: 'incoming' }));
            const allEvents = [...outgoing, ...incoming];

            const tenDaysReminders = allEvents.filter(a => {
                const evDate = new Date(a.date + 'T12:00:00');
                const diffTime = evDate.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays === 10;
            });

            if (tenDaysReminders.length > 0) {
                localStorage.setItem('last_auto_check', todayStr);
                window.showToast(`🔔 Tienes ${tenDaysReminders.length} recordatorios pendientes para enviar a 10 días.`, 'warning');
                if (Notification.permission === "granted") {
                    new Notification("Recordatorios (10 días)", {
                        body: `Tienes ${tenDaysReminders.length} discursos programados para dentro de 10 días. ¡Envía los recordatorios hoy!`,
                    });
                }
            }
            localStorage.setItem('last_auto_check', todayStr);
        }
    }
};
