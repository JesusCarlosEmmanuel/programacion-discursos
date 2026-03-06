import { State } from '../context/state.js';

export const NotificationService = {
    getGreeting() {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "Hola, buen día";
        if (hour >= 12 && hour < 19) return "Hola, buena tarde";
        return "Hola, buena noche";
    },

    /**
     * Standardizes date display to DD-MM-YYYY
     */
    formatDate(isoDate) {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${d}-${m}-${y}`;
    },

    /**
     * Opens WhatsApp with a pre-formatted message
     * @param {string} type 'outgoing' or 'incoming'
     * @param {string} eventId ID of the event
     * @param {string} target 'speaker' | 'coordinator' | 'local_coordinator'
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
        const displayDate = this.formatDate(event.date);
        const local = State.congregation || {};
        const greeting = this.getGreeting();

        let message = "";
        let phone = speaker.phone;

        if (isOutgoing) {
            const dest = State.destinations.find(d => d.name === event.destination_congregation) || {};
            const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            if (target === 'speaker') {
                message = `${greeting} hermano ${speaker.name}, le recordamos su discurso programado para este próximo ${dayName} ${displayDate} en la congregación "${event.destination_congregation}".\n\n📌 Día y Horario: ${capitalizedDay} a las ${event.time}\n📍 Domicilio: ${dest.address || '---'}\n📞 Contacto anfitrión: ${dest.contact_name || ''} (${dest.contact_phone || '---'})\n\nEl bosquejo que presentará es el #${event.outline_number} "${event.talk_title}". ¡Mucho éxito en su asignación!\n\nAtte: ${local.name || 'Mi Congregación'}`;
            } else if (target === 'coordinator') {
                // Host Coordinator
                phone = dest.contact_phone || '';
                message = `${greeting} hermano ${dest.contact_name || 'Coordinador'}, le confirmo que el hermano ${speaker.name} (${speaker.phone}) asistirá con ustedes este próximo ${dayName} ${displayDate} a las ${event.time}. Presentará el bosquejo #${event.outline_number} "${event.talk_title}"${event.song_number ? ` (Cántico ${event.song_number})` : ''}.\n\nSaludos fraternales de la Congregación ${local.name || ''}.`;
            } else if (target === 'local_coordinator') {
                // Local Coordinator
                phone = local.scheduler?.phone || '';
                message = `${greeting} hermano ${local.scheduler?.name || 'Coordinador'}, le informo para su registro que el hermano ${speaker.name} tiene programado el discurso #${event.outline_number} en la congregación ${event.destination_congregation} el día ${displayDate} a las ${event.time}. Saludos.`;
            }
        } else {
            // Incoming
            const combined = [...State.destinations, ...State.origins];
            const origin = combined.find(o => o.name === event.congregation_origin) || {};

            // Fix: Try to get phone from event if not found in masters
            const coordPhone = event.speaker_phone || origin.contact_phone || '';

            if (target === 'speaker') {
                message = `${greeting} hermano ${speaker.name}, le recordamos que lo esperamos este próximo ${dayName} ${displayDate} a las ${event.time} en nuestra congregación "${local.name || ''}".\n\n📍 Dirección: ${local.address || '---'}\n\nUsted presentará el tema #${event.outline_number} "${event.talk_title}"${event.song_number ? ` (Cántico ${event.song_number})` : ''}.\n\nCualquier duda, su contacto es: ${local.scheduler?.name || 'el coordinador'} (${local.scheduler?.phone || '---'}). ¡Le esperamos!`;
            } else if (target === 'coordinator') {
                // Origin Coordinator
                phone = coordPhone;
                message = `${greeting} hermano de la congregación ${event.congregation_origin}, le confirmo que esperamos a su discursante, el hermano ${speaker.name}, este próximo ${dayName} ${displayDate} a las ${event.time} para presentar el bosquejo #${event.outline_number}.\n\nSaludos fraternales de la Congregación ${local.name || ''}.`;
            } else if (target === 'local_coordinator') {
                // Local Coordinator
                phone = local.scheduler?.phone || '';
                message = `${greeting} hermano ${local.scheduler?.name || 'Coordinador'}, le informo que el hermano ${speaker.name} (${speaker.phone}) de la congregación ${event.congregation_origin} está confirmado para presentar el discurso #${event.outline_number} el día ${displayDate} a las ${event.time}. Saludos.`;
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
    },

    shareSpeakerCatalog(speakers) {
        if (!speakers || speakers.length === 0) {
            window.showToast('No hay discursantes para compartir', 'warning');
            return;
        }

        let message = `*CATÁLOGO DE DISCURSANTES*\n\n`;
        // Sort speakers alphabetically
        const sortedSpeakers = [...speakers].sort((a, b) => a.name.localeCompare(b.name));

        sortedSpeakers.forEach(s => {
            message += `👤 *${s.name.toUpperCase()}*\n`;
            if (s.talks && s.talks.length > 0) {
                s.talks.forEach(t => {
                    message += `• #${t.outline} ${t.title}\n`;
                });
            } else {
                message += `(Sin temas registrados)\n`;
            }
            message += `\n`;
        });

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    shareSpeakerAvailability(month) {
        const speakers = State.authorized;
        if (!speakers || speakers.length === 0) {
            window.showToast('No hay discursantes registrados', 'warning');
            return;
        }

        const date = new Date(month + '-01T12:00:00');
        const monthName = date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

        let message = `*DISPONIBILIDAD PARA COORDINACIÓN (${monthName.toUpperCase()})*\n`;
        message += `_Los siguientes hermanos tienen fechas disponibles este mes:_\n\n`;

        // Find all weekends in the month
        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const weekends = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const cur = new Date(date.getFullYear(), date.getMonth(), d);
            if (cur.getDay() === 0 || cur.getDay() === 6) {
                const dateStr = cur.toISOString().split('T')[0];
                if (!weekends.includes(dateStr)) weekends.push(dateStr);
            }
        }

        const sortedSpeakers = [...speakers].sort((a, b) => a.name.localeCompare(b.name));
        let availableCount = 0;

        sortedSpeakers.forEach(s => {
            const assignments = State.outgoing.filter(e => e.speaker_id === s.id && e.date.startsWith(month));
            const availableDates = weekends
                .filter(w => !assignments.some(a => a.date === w))
                .map(w => w.split('-')[2]);

            if (availableDates.length > 0) {
                availableCount++;
                message += `👤 *${s.name.toUpperCase()}*\n`;
                message += `✅ Disponible: ${availableDates.join(', ')}\n`;

                if (s.talks && s.talks.length > 0) {
                    message += `*Temas:*\n`;
                    s.talks.forEach(t => {
                        message += `• #${t.outline} ${t.title}\n`;
                    });
                } else {
                    message += `(Sin temas registrados)\n`;
                }
                message += `\n`;
            }
        });

        if (availableCount === 0) {
            window.showToast('No hay discursantes con disponibilidad en este mes', 'warning');
            return;
        }

        message += `_Enviado desde Programación Discursantes_`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }
};

window.NotificationService = NotificationService;

