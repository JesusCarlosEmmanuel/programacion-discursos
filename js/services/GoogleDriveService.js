/**
 * GoogleDriveService.js (Skeleton)
 * Placeholder for Google Drive integration.
 */

export const GoogleDriveService = {
    accessToken: null,

    async login() {
        console.log("Iniciando sesión con Google Drive...");
        window.showToast("Google Drive estará disponible próximamente", "info");
        return false;
    },

    async syncToCloud(state) {
        console.log("Sincronizando con Google Drive (No implementado)");
    },

    async pullFromCloud() {
        console.log("Descargando de Google Drive (No implementado)");
        return null;
    }
};
