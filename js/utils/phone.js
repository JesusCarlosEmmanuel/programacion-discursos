/**
 * Phone number utilities
 */
export const PhoneUtils = {
    /**
     * Cleans and formats a phone number for WhatsApp links.
     * @param {string} phone 
     * @returns {string} Cleaned phone number with country code
     */
    validate(phone) {
        if (!phone) return '';
        // Remove non-numeric characters
        let cleaned = phone.replace(/\D/g, '');
        // If it starts with 044 or 045 (Mexico), remove it
        if (cleaned.startsWith('044')) cleaned = cleaned.substring(3);
        if (cleaned.startsWith('045')) cleaned = cleaned.substring(3);
        // If it doesn't have country code (assuming Mexico 52), add it
        if (cleaned.length === 10) cleaned = '52' + cleaned;
        return cleaned;
    }
};
