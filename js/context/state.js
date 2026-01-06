/**
 * State Management System using LocalStorage
 */

const STORAGE_KEYS = {
    AUTHORIZED_SPEAKERS: 'speaker_app_authorized',
    OUTGOING_EVENTS: 'speaker_app_outgoing',
    INCOMING_EVENTS: 'speaker_app_incoming',
    SETTINGS: 'speaker_app_settings'
};

export const State = {
    authorized: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTHORIZED_SPEAKERS) || '[]'),
    outgoing: JSON.parse(localStorage.getItem(STORAGE_KEYS.OUTGOING_EVENTS) || '[]'),
    incoming: JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOMING_EVENTS) || '[]'),

    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Authorized Speakers Actions
    addAuthorizedSpeaker(speaker) {
        this.authorized.push(speaker);
        this.saveToStorage(STORAGE_KEYS.AUTHORIZED_SPEAKERS, this.authorized);
    },

    updateAuthorizedSpeaker(updatedSpeaker) {
        this.authorized = this.authorized.map(s => s.id === updatedSpeaker.id ? updatedSpeaker : s);
        this.saveToStorage(STORAGE_KEYS.AUTHORIZED_SPEAKERS, this.authorized);
    },

    // Events Actions
    addOutgoingEvent(event) {
        this.outgoing.push(event);
        this.saveToStorage(STORAGE_KEYS.OUTGOING_EVENTS, this.outgoing);
    },

    addIncomingEvent(event) {
        this.incoming.push(event);
        this.saveToStorage(STORAGE_KEYS.INCOMING_EVENTS, this.incoming);
    },

    deleteEvent(type, id) {
        if (type === 'outgoing') {
            this.outgoing = this.outgoing.filter(e => e.id !== id);
            this.saveToStorage(STORAGE_KEYS.OUTGOING_EVENTS, this.outgoing);
        } else {
            this.incoming = this.incoming.filter(e => e.id !== id);
            this.saveToStorage(STORAGE_KEYS.INCOMING_EVENTS, this.incoming);
        }
    }
};
