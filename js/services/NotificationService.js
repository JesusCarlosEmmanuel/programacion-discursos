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
            const dest = State.destinations.find(d => d.name === event.destination_congregation) || {};
            if (target === 'speaker') {
                message = `${greeting} hermano ${speaker.name}, te recordamos tu discurso programado para este próximo ${dayName} ${event.date} en la congregación "${event.destination_congregation}".\n\n📌 Día y Horario: ${dest.meeting_day || '---'} a las ${event.time}\n📍 Domicilio: ${dest.address || '---'}\n📞 Contacto anfitrión: ${dest.contact_name || ''} (${dest.contact_phone || '---'})\n\nEl bosquejo que presentarás es el #${event.outline_number} "${event.talk_title}". ¡Mucho éxito en tu asignación!\n\nAtte: ${local.name || 'Mi Congregación'}`;
            } else if (target === 'coordinator') {
                // Host Coordinator
                phone = dest.contact_phone || '';
                message = `${greeting} hermano ${dest.contact_name || 'Coordinador'}, te confirmo que el hermano ${speaker.name} (${speaker.phone}) asistirá con ustedes este próximo ${dayName} ${event.date} a las ${event.time}. Presentará el bosquejo #${event.outline_number} "${event.talk_title}"${event.song_number ? ` (Cántico ${event.song_number})` : ''}.\n\nSaludos fraternales de la Congregación ${local.name || ''}.`;
            } else if (target === 'local_coordinator') {
                // Local Coordinator
                phone = local.scheduler?.phone || '';
                message = `${greeting} hermano ${local.scheduler?.name || 'Coordinador'}, te informo para tu registro que el hermano ${speaker.name} tiene programado el discurso #${event.outline_number} en la congregación ${event.destination_congregation} el día ${event.date} a las ${event.time}. Saludos.`;
            }
        } else {
            // Incoming
            const combined = [...State.destinations, ...State.origins];
            const origin = combined.find(o => o.name === event.congregation_origin) || {};
            if (target === 'speaker') {
                message = `${greeting} hermano ${speaker.name}, te recordamos que te esperamos este próximo ${dayName} ${event.date} a las ${event.time} en nuestra congregación "${local.name || ''}".\n\n📍 Dirección: ${local.address || '---'}\n\nPresentarás el tema #${event.outline_number} "${event.talk_title}"${event.song_number ? ` (Cántico ${event.song_number})` : ''}.\n\nCualquier duda, tu contacto es: ${local.scheduler?.name || 'el coordinador'} (${local.scheduler?.phone || '---'}). ¡Te esperamos!`;
            } else if (target === 'coordinator') {
                // Origin Coordinator
                phone = origin.contact_phone || '';
                message = `${greeting} hermano ${origin.contact_name || 'Coordinador'} de la congregación ${event.congregation_origin}, te confirmo que esperamos a su discursante, el hermano ${speaker.name}, este próximo ${dayName} ${event.date} a las ${event.time} para presentar el bosquejo #${event.outline_number}.\n\nSaludos fraternales de la Congregación ${local.name || ''}.`;
            } else if (target === 'local_coordinator') {
                // Local Coordinator
                phone = local.scheduler?.phone || '';
                message = `${greeting} hermano ${local.scheduler?.name || 'Coordinador'}, te informo que el hermano ${speaker.name} (${speaker.phone}) de la congregación ${event.congregation_origin} está confirmado para presentar el discurso #${event.outline_number} el día ${event.date} a las ${event.time}. Saludos.`;
            }
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

    shareSupervisorReport(events, rangeText, typeFilter) {
        if (events.length === 0) return;
        let message = `*Reporte de Programación (${rangeText})*\n\n`;
        const local = State.congregation || {};

        if (typeFilter === 'Viene' || typeFilter === 'all') {
            const incomingEvents = events.filter(e => e.type === 'Viene');
            if (incomingEvents.length > 0) {
                message += `*DISCURSANTES QUE VIENEN*\n\n`;
                incomingEvents.forEach(e => {
                    message += `Congregación: ${e.congregation_origin}\n` +
                        `Teléfono: ${e.speaker_phone}\n` +
                        `Discursante: ${e.speaker_name}\n` +
                        `Canción: ${e.song_number || '---'}\n` +
                        `No. Bosquejo: ${e.outline_number}\n` +
                        `Título: ${e.talk_title}\n` +
                        `Fecha: ${e.date}\n` +
                        `Horario (Local): ${e.time}\n` +
                        `------------------------\n\n`;
                });
            }
        }

        if (typeFilter === 'Van' || typeFilter === 'all') {
            const outgoingEvents = events.filter(e => e.type === 'Van');
            if (outgoingEvents.length > 0) {
                message += `*DISCURSANTES QUE VAN*\n\n`;
                outgoingEvents.forEach(e => {
                    const speaker = State.authorized.find(s => s.id === e.speaker_id)?.name || '---';
                    const dest = State.destinations.find(d => d.name === e.destination_congregation) || {};
                    message += `Congregación destino: ${e.destination_congregation}\n` +
                        `Contacto: ${dest.contact_name || '---'} (${dest.contact_phone || '---'})\n` +
                        `Domicilio: ${dest.address || '---'}\n` +
                        `Discursante: ${speaker}\n` +
                        `No. Bosquejo: ${e.outline_number}\n` +
                        `Título: ${e.talk_title}\n` +
                        `Fecha: ${e.date}\n` +
                        `Horario (Destino): ${e.time}\n` +
                        `Comentarios: ${e.comments || '---'}\n` +
                        `------------------------\n\n`;
                });
            }
        }

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
