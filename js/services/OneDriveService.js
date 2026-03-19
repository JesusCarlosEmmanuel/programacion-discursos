/**
 * OneDriveService.js
 * Handles authentication and data synchronization with Microsoft OneDrive Excel.
 */

const msalConfig = {
    auth: {
        clientId: "a6245d61-c167-463d-8877-334341997d91", // Master Key para todas las cuentas
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false
    }
};

let msalInstance = null;

export const OneDriveService = {
    accessToken: null,
    account: null,
    fileName: 'ProgramacionDiscursos_Cloud.xlsx',

    async init() {
        if (!msalInstance) {
            msalInstance = new msal.PublicClientApplication(msalConfig);
        }
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
            this.account = accounts[0];
            await this.getAccessToken();
        }
    },

    async login() {
        try {
            await this.init();
            const response = await msalInstance.loginPopup({
                scopes: ["Files.ReadWrite", "User.Read"]
            });
            this.account = response.account;
            this.accessToken = response.accessToken;
            window.showToast("Conexión con OneDrive exitosa", "success");
            return true;
        } catch (error) {
            console.error("Login Error:", error);
            window.showToast("Error al conectar con OneDrive", "danger");
            return false;
        }
    },

    async getAccessToken() {
        if (!this.account) return null;
        try {
            const request = {
                scopes: ["Files.ReadWrite", "User.Read"],
                account: this.account
            };
            const response = await msalInstance.acquireTokenSilent(request);
            this.accessToken = response.accessToken;
            return this.accessToken;
        } catch (error) {
            if (error instanceof msal.InteractionRequiredAuthError) {
                return msalInstance.acquireTokenPopup(request);
            }
        }
    },

    /**
     * Sincroniza el estado local a la nube (Excel)
     */
    async syncToCloud(state) {
        if (!this.accessToken) await this.getAccessToken();
        if (!this.accessToken) return;

        try {
            // 1. Buscamos el archivo
            let fileId = await this.findFile(this.fileName);
            if (!fileId) {
                fileId = await this.createFile(this.fileName);
            }

            // 2. Aseguramos que existan las hojas de la app (No tocamos las del usuario)
            await this.ensureSheetsExist(fileId);

            // 3. Sincronizamos datos
            await this.updateAppData(fileId, state);

            // Actualizar timestamp de última sincronización
            localStorage.setItem('last_cloud_sync', new Date().toISOString());
            return true;
        } catch (error) {
            console.error("Sync Error:", error);
            return false;
        }
    },

    async ensureSheetsExist(fileId) {
        const requiredSheets = ['_APP_AUTHORIZED_', '_APP_OUTGOING_', '_APP_INCOMING_', '_APP_MASTERS_'];

        // Listar hojas actuales
        const url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/workbook/worksheets`;
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
        const data = await resp.json();
        const existingNames = data.value.map(s => s.name);

        for (const name of requiredSheets) {
            if (!existingNames.includes(name)) {
                console.log(`Creando hoja de app: ${name}`);
                await fetch(url, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name: name })
                });
            }
        }
    },

    async findFile(name) {
        const url = `https://graph.microsoft.com/v1.0/me/drive/root/children?search='${name}'`;
        const resp = await fetch(url, { headers: { Authorization: `Bearer ${this.accessToken}` } });
        const data = await resp.json();
        return data.value && data.value.length > 0 ? data.value[0].id : null;
    },

    async createFile(name) {
        const url = `https://graph.microsoft.com/v1.0/me/drive/root/children`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                file: {}
            })
        });
        const data = await resp.json();
        return data.id;
    },

    async updateAppData(fileId, state) {
        // Por ahora simulamos el volcado masivo a las hojas creadas
        console.log("Actualizando datos en las hojas _APP_...");
        // API: PATCH /me/drive/items/{id}/workbook/worksheets/{sheet}/range(address='A1:Z500')
        return true;
    },

    /**
     * Trae los datos de la nube al local (para otros dispositivos)
     */
    async pullFromCloud() {
        if (!this.accessToken) await this.getAccessToken();
        if (!this.accessToken) return null;

        try {
            const fileId = await this.findFile(this.fileName);
            if (!fileId) return null;

            console.log("Descargando datos desde OneDrive Excel...");
            // Aquí iría el fetch a /drive/items/{fileId}/workbook/worksheets/...
            // Por ahora, devolvemos un objeto vacío para no romper el flujo, 
            // pero el sistema ya sabe buscar el archivo.
            return {};
        } catch (error) {
            console.error("Pull Error:", error);
            return null;
        }
    }
};
