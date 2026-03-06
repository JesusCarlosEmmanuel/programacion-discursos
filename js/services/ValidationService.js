/**
 * ValidationService.js
 * Handles business rules and conflict detection.
 */
import { State } from '../context/state.js';

export const ValidationService = {
    /**
     * Checks if a speaker is already assigned to a talk in a specific month
     */
    isSpeakerBusyInMonth(speakerId, monthStr) {
        // monthStr as "YYYY-MM"
        return State.outgoing.some(e => e.speaker_id === speakerId && e.date.startsWith(monthStr));
    },

    /**
     * Checks if there's a conflict on a specific date (already a talk assigned)
     */
    hasConflictOnDate(dateStr) {
        const hasIncoming = State.incoming.some(e => e.date === dateStr);
        const hasOutgoing = State.outgoing.some(e => e.date === dateStr);
        const hasException = State.exceptions.some(e => e.date === dateStr);
        return hasIncoming || hasOutgoing || hasException;
    },

    /**
     * Standardizes phone numbers
     */
    cleanPhone(phone) {
        if (!phone) return '';
        return phone.replace(/\D/g, '');
    },

    /**
     * Validates if a date object is a weekend
     */
    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    }
};
