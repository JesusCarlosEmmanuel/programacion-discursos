import { StorageService } from '../services/StorageService.js';

const { KEYS } = StorageService;

export const State = {
    authorized: StorageService.load(KEYS.AUTHORIZED_SPEAKERS),
    outgoing: StorageService.load(KEYS.OUTGOING_EVENTS),
    incoming: StorageService.load(KEYS.INCOMING_EVENTS),
    congregation: StorageService.load(KEYS.CONGREGATION, {}),
    destinations: StorageService.load(KEYS.DESTINATIONS),
    origins: StorageService.load(KEYS.ORIGINS),
    exceptions: StorageService.load(KEYS.EXCEPTIONS),
    trash: null,

    saveToStorage(key, data) {
        StorageService.save(key, data);
    },

    // Authorized Speakers Actions
    addAuthorizedSpeaker(speaker) {
        this.authorized.push(speaker);
        this.saveToStorage(KEYS.AUTHORIZED_SPEAKERS, this.authorized);
    },

    updateAuthorizedSpeaker(updatedSpeaker) {
        this.authorized = this.authorized.map(s => s.id === updatedSpeaker.id ? updatedSpeaker : s);
        this.saveToStorage(KEYS.AUTHORIZED_SPEAKERS, this.authorized);
    },

    // Events Actions
    addOutgoingEvent(event) {
        this.outgoing.push(event);
        this.saveToStorage(KEYS.OUTGOING_EVENTS, this.outgoing);
    },

    addIncomingEvent(event) {
        this.incoming.push(event);
        this.saveToStorage(KEYS.INCOMING_EVENTS, this.incoming);
    },

    deleteEvent(type, id) {
        if (type === 'outgoing') {
            this.outgoing = this.outgoing.filter(e => e.id !== id);
            this.saveToStorage(KEYS.OUTGOING_EVENTS, this.outgoing);
        } else {
            this.incoming = this.incoming.filter(e => e.id !== id);
            this.saveToStorage(KEYS.INCOMING_EVENTS, this.incoming);
        }
    },

    updateCongregation(data) {
        this.congregation = { ...this.congregation, ...data };
        this.saveToStorage(KEYS.CONGREGATION, this.congregation);
    },

    // Exceptions Actions
    addException(exception) {
        this.exceptions.push(exception);
        this.saveToStorage(KEYS.EXCEPTIONS, this.exceptions);
    },

    deleteException(id) {
        this.exceptions = this.exceptions.filter(e => e.id !== id);
        this.saveToStorage(KEYS.EXCEPTIONS, this.exceptions);
    },

    // Destination/Origin Actions
    saveMaster(type, data) {
        const key = type === 'destinations' ? KEYS.DESTINATIONS : KEYS.ORIGINS;
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
        const key = type === 'destinations' ? KEYS.DESTINATIONS : KEYS.ORIGINS;
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
        this.trash = {
            type,
            data: type === 'authorized' ? this.authorized.filter(i => ids.includes(i.id))
                : type === 'outgoing' ? this.outgoing.filter(i => ids.includes(i.id))
                    : this.incoming.filter(i => ids.includes(i.id))
        };

        if (type === 'authorized') {
            this.authorized = this.authorized.filter(i => !ids.includes(i.id));
            this.saveToStorage(KEYS.AUTHORIZED_SPEAKERS, this.authorized);
        } else if (type === 'outgoing') {
            this.outgoing = this.outgoing.filter(i => !ids.includes(i.id));
            this.saveToStorage(KEYS.OUTGOING_EVENTS, this.outgoing);
        } else if (type === 'incoming') {
            this.incoming = this.incoming.filter(i => !ids.includes(i.id));
            this.saveToStorage(KEYS.INCOMING_EVENTS, this.incoming);
        }
    },

    undoDelete() {
        if (!this.trash) return;
        const { type, data } = this.trash;
        if (type === 'authorized') {
            this.authorized = [...this.authorized, ...data];
            this.saveToStorage(KEYS.AUTHORIZED_SPEAKERS, this.authorized);
        } else if (type === 'outgoing') {
            this.outgoing = [...this.outgoing, ...data];
            this.saveToStorage(KEYS.OUTGOING_EVENTS, this.outgoing);
        } else if (type === 'incoming') {
            this.incoming = [...this.incoming, ...data];
            this.saveToStorage(KEYS.INCOMING_EVENTS, this.incoming);
        }
        this.trash = null;
    }
};

