/**
 * StorageService.js
 * Centralizes all data persistence logic.
 * Currently handles LocalStorage, prepared for OneDrive integration.
 */

export const StorageService = {
    KEYS: {
        AUTHORIZED_SPEAKERS: 'speaker_app_authorized',
        OUTGOING_EVENTS: 'speaker_app_outgoing',
        INCOMING_EVENTS: 'speaker_app_incoming',
        CONGREGATION: 'speaker_app_congregation',
        DESTINATIONS: 'speaker_app_destinations',
        ORIGINS: 'speaker_app_origins',
        EXCEPTIONS: 'speaker_app_exceptions',
        SETTINGS: 'speaker_app_settings'
    },

    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            // Future: Trigger OneDrive sync here
            return true;
        } catch (e) {
            console.error("Storage save failed:", e);
            return false;
        }
    },

    load(key, fallback = []) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : fallback;
        } catch (e) {
            console.error("Storage load failed:", e);
            return fallback;
        }
    },

    clearAll() {
        localStorage.clear();
    },

    /**
     * Export all data as a single object for Backup
     */
    getBackupData() {
        return {
            authorized: this.load(this.KEYS.AUTHORIZED_SPEAKERS),
            outgoing: this.load(this.KEYS.OUTGOING_EVENTS),
            incoming: this.load(this.KEYS.INCOMING_EVENTS),
            congregation: this.load(this.KEYS.CONGREGATION, {}),
            destinations: this.load(this.KEYS.DESTINATIONS),
            origins: this.load(this.KEYS.ORIGINS),
            exceptions: this.load(this.KEYS.EXCEPTIONS)
        };
    },

    importBackupData(data) {
        if (!data) return false;
        if (data.authorized) this.save(this.KEYS.AUTHORIZED_SPEAKERS, data.authorized);
        if (data.outgoing) this.save(this.KEYS.OUTGOING_EVENTS, data.outgoing);
        if (data.incoming) this.save(this.KEYS.INCOMING_EVENTS, data.incoming);
        if (data.congregation) this.save(this.KEYS.CONGREGATION, data.congregation);
        if (data.destinations) this.save(this.KEYS.DESTINATIONS, data.destinations);
        if (data.origins) this.save(this.KEYS.ORIGINS, data.origins);
        if (data.exceptions) this.save(this.KEYS.EXCEPTIONS, data.exceptions);
        return true;
    }
};
