import { OneDriveService } from './OneDriveService.js';
/**
 * AuthService.js
 * Handles user authentication across multiple providers (Firebase based).
 */

export const AuthService = {
    user: null,

    // Config will be populated via UI later
    config: {
        apiKey: localStorage.getItem('fb_api_key') || '',
        authDomain: localStorage.getItem('fb_auth_domain') || '',
        projectId: localStorage.getItem('fb_project_id') || ''
    },

    async init() {
        // Initialize Firebase if config exists
        console.log("AuthService Initializing...");
        const savedUser = localStorage.getItem('app_user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
        }
        return this.user;
    },

    async login(provider) {
        console.log(`Logging in with ${provider}...`);

        if (provider === 'microsoft') {
            const success = await OneDriveService.login();
            if (success && OneDriveService.account) {
                const msUser = {
                    uid: OneDriveService.account.homeAccountId,
                    displayName: OneDriveService.account.name,
                    email: OneDriveService.account.username,
                    photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(OneDriveService.account.name)}&background=00a4ef&color=fff`,
                    provider: 'microsoft'
                };
                this.user = msUser;
                localStorage.setItem('app_user', JSON.stringify(this.user));
                return this.user;
            }
            throw new Error("Microsoft login failed");
        }

        // Mock login for other providers to demonstrate UI flow
        const mockUser = {
            uid: '12345',
            displayName: 'Usuario Prueba',
            email: 'usuario@ejemplo.com',
            photoURL: 'https://ui-avatars.com/api/?name=Usuario+Prueba',
            provider: provider
        };

        this.user = mockUser;
        localStorage.setItem('app_user', JSON.stringify(this.user));
        return this.user;
    },

    async logout() {
        this.user = null;
        localStorage.removeItem('app_user');
        window.location.reload();
    },

    isAuthenticated() {
        return !!this.user;
    }
};
