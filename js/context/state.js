/**
 * State Management System using LocalStorage
 */

const STORAGE_KEYS = {
    AUTHORIZED_SPEAKERS: 'speaker_app_authorized',
    OUTGOING_EVENTS: 'speaker_app_outgoing',
    INCOMING_EVENTS: 'speaker_app_incoming',
    SETTINGS: 'speaker_app_settings',
    CONGREGATION: 'speaker_app_congregation',
    DESTINATIONS: 'speaker_app_destinations',
    ORIGINS: 'speaker_app_origins'
};

export const State = {
    authorized: JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTHORIZED_SPEAKERS) || '[]'),
    outgoing: JSON.parse(localStorage.getItem(STORAGE_KEYS.OUTGOING_EVENTS) || '[]'),
    incoming: JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOMING_EVENTS) || '[]'),
    congregation: JSON.parse(localStorage.getItem(STORAGE_KEYS.CONGREGATION) || '{}'),
    destinations: JSON.parse(localStorage.getItem(STORAGE_KEYS.DESTINATIONS) || '[]'),
    origins: JSON.parse(localStorage.getItem(STORAGE_KEYS.ORIGINS) || '[]'),
    trash: null, // Temporary storage for undo

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
    },

    updateCongregation(data) {
        this.congregation = { ...this.congregation, ...data };
        this.saveToStorage(STORAGE_KEYS.CONGREGATION, this.congregation);
    },

    // Destination Congregations
    addDestination(dest) {
        this.destinations.push(dest);
        this.saveToStorage(STORAGE_KEYS.DESTINATIONS, this.destinations);
    },

    // Bulk Deletion with Undo
    bulkDelete(type, ids) {
        // Save to trash first
        this.trash = {
            type,
            data: type === 'authorized' ? this.authorized.filter(i => ids.includes(i.id))
                : type === 'outgoing' ? this.outgoing.filter(i => ids.includes(i.id))
                    : this.incoming.filter(i => ids.includes(i.id))
        };

        if (type === 'authorized') {
            this.authorized = this.authorized.filter(i => !ids.includes(i.id));
            this.saveToStorage(STORAGE_KEYS.AUTHORIZED_SPEAKERS, this.authorized);
        } else if (type === 'outgoing') {
            this.outgoing = this.outgoing.filter(i => !ids.includes(i.id));
            this.saveToStorage(STORAGE_KEYS.OUTGOING_EVENTS, this.outgoing);
        } else if (type === 'incoming') {
            this.incoming = this.incoming.filter(i => !ids.includes(i.id));
            this.saveToStorage(STORAGE_KEYS.INCOMING_EVENTS, this.incoming);
        }
    },

    undoDelete() {
        if (!this.trash) return;
        const { type, data } = this.trash;
        if (type === 'authorized') {
            this.authorized = [...this.authorized, ...data];
            this.saveToStorage(STORAGE_KEYS.AUTHORIZED_SPEAKERS, this.authorized);
        } else if (type === 'outgoing') {
            this.outgoing = [...this.outgoing, ...data];
            this.saveToStorage(STORAGE_KEYS.OUTGOING_EVENTS, this.outgoing);
        } else if (type === 'incoming') {
            this.incoming = [...this.incoming, ...data];
            this.saveToStorage(STORAGE_KEYS.INCOMING_EVENTS, this.incoming);
        }
        this.trash = null;
    }
};
