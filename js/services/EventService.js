import { State } from '../context/state.js';

export const EventService = {
    /**
     * Valida y guarda una salida (Discursante Local va a otra Congregación)
     * @param {Object} data Datos del evento formados
     * @returns {Object} { success: boolean, message?: string }
     */
    saveOutgoing(data) {
        const isEditing = State.outgoing.some(e => e.id === data.id);

        // Check if date is an exception (Asamblea, etc)
        const exception = State.exceptions?.find(ex => ex.date === data.date);
        if (exception) {
            if (!confirm(`La fecha ${data.date} está marcada como "${exception.title}". ¿Deseas programar una salida de todos modos?`)) {
                return { success: false, message: 'Operación cancelada.' };
            }
        }

        // Rule: 1 outgoing per month recommended
        const dateObj = new Date(data.date + 'T12:00:00');
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        const count = State.outgoing.filter(e => {
            const d = new Date(e.date + 'T12:00:00');
            return e.speaker_id === data.speaker_id &&
                d.getMonth() === month &&
                d.getFullYear() === year &&
                e.id !== data.id;
        }).length;

        if (count >= 1 && !isEditing) {
            if (!confirm('Este discursante ya tiene una salida este mes. ¿Continuar?')) {
                return { success: false, message: 'Cancelado.' };
            }
        }

        if (isEditing) {
            State.outgoing = State.outgoing.map(e => e.id === data.id ? data : e);
        } else {
            State.outgoing.push(data);
        }

        State.saveToStorage('speaker_app_outgoing', State.outgoing);
        return { success: true };
    },

    /**
     * Valida y guarda una visita (Discursante Visitante viene a la Congregación Local)
     * @param {Object} data Datos del evento formados
     * @returns {Object} { success: boolean, message?: string }
     */
    saveIncoming(data) {
        const isEditing = State.incoming.some(e => e.id === data.id);

        // Check if date is an exception (Asamblea, etc) - Usually no guests on these dates
        const exception = State.exceptions?.find(ex => ex.date === data.date);
        if (exception) {
            alert(`No puedes programar una visita el ${data.date} porque es "${exception.title}".`);
            return { success: false, message: 'Fecha bloqueada por excepción.' };
        }

        // Rule: Same outline not in less than 4 months (improved from 3)
        const newDate = new Date(data.date + 'T12:00:00');
        const minGap = 4; // months

        const recent = State.incoming.find(e => {
            if (e.id === data.id) return false;
            if (e.outline_number !== data.outline_number) return false;

            const prevDate = new Date(e.date + 'T12:00:00');
            const diffMonths = (newDate.getFullYear() - prevDate.getFullYear()) * 12 + (newDate.getMonth() - prevDate.getMonth());
            return Math.abs(diffMonths) < minGap;
        });

        if (recent && !isEditing) {
            if (!confirm(`El discurso #${data.outline_number} se presentó el ${recent.date} (hace menos de ${minGap} meses). ¿Deseas continuar?`)) {
                return { success: false, message: 'Cancelado.' };
            }
        }

        if (isEditing) {
            State.incoming = State.incoming.map(e => e.id === data.id ? data : e);
        } else {
            State.incoming.push(data);
        }

        State.saveToStorage('speaker_app_incoming', State.incoming);
        return { success: true };
    },

    // Check if a weekend is missing an incoming speaker
    checkWeekendCoverage(dateStr) {
        const exception = State.exceptions?.find(ex => ex.date === dateStr);
        if (exception) return { status: 'exception', title: exception.title };

        const hasIncoming = State.incoming.some(e => e.date === dateStr);
        if (hasIncoming) return { status: 'covered' };

        return { status: 'missing' };
    },

    deleteEvents(type, ids, undoCallback) {
        State.bulkDelete(type, ids);

        if (undoCallback) {
            window.showUndo(`Eliminado(s) ${ids.length} evento(s)`, () => {
                State.undoDelete();
                undoCallback();
            });
        }
    }
};
