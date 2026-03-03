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
    ORIGINS: 'speaker_app_origins',
    EXCEPTIONS: 'speaker_app_exceptions'
};

const safeParse = (key, fallback = []) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error parsing ${key}:`, e);
        return fallback;
    }
};

export const State = {
    authorized: safeParse(STORAGE_KEYS.AUTHORIZED_SPEAKERS),
    outgoing: safeParse(STORAGE_KEYS.OUTGOING_EVENTS),
    incoming: safeParse(STORAGE_KEYS.INCOMING_EVENTS),
    congregation: safeParse(STORAGE_KEYS.CONGREGATION, {}),
    destinations: safeParse(STORAGE_KEYS.DESTINATIONS),
    origins: safeParse(STORAGE_KEYS.ORIGINS),
    exceptions: safeParse(STORAGE_KEYS.EXCEPTIONS),
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

    // Exceptions Actions
    addException(exception) {
        this.exceptions.push(exception);
        this.saveToStorage(STORAGE_KEYS.EXCEPTIONS, this.exceptions);
    },

    deleteException(id) {
        this.exceptions = this.exceptions.filter(e => e.id !== id);
        this.saveToStorage(STORAGE_KEYS.EXCEPTIONS, this.exceptions);
    },

    // Destination/Origin Actions
    saveMaster(type, data) {
        const key = type === 'destinations' ? STORAGE_KEYS.DESTINATIONS : STORAGE_KEYS.ORIGINS;
        if (type === 'destinations') {
            const idx = this.destinations.findIndex(i => i.id === data.id);
            if (idx !== -1) this.destinations[idx] = data;
            else this.destinations.push(data);
            this.saveToStorage(key, this.destinations);
        } else {
            const idx = this.origins.findIndex(i => i.id === data.id);
            if (idx !== -1) this.origins[idx] = data;
            else this.origins.push(data);
            this.saveToStorage(key, this.origins);
        }
    },

    deleteMaster(type, id) {
        const key = type === 'destinations' ? STORAGE_KEYS.DESTINATIONS : STORAGE_KEYS.ORIGINS;
        if (type === 'destinations') {
            this.destinations = this.destinations.filter(i => i.id !== id);
            this.saveToStorage(key, this.destinations);
        } else {
            this.origins = this.origins.filter(i => i.id !== id);
            this.saveToStorage(key, this.origins);
        }
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
