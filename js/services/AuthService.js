import { FirebaseService } from './FirebaseService.js';
/**
 * AuthService.js
 * Handles user authentication via Firebase
 */

export const AuthService = {
    user: null,

    async init() {
        console.log("AuthService Initializing...");
        FirebaseService.init(); // Intentar inicializar si ya hay config

        // Primero verificamos si venimos de un Redirect de Google Login (móviles/PWA)
        try {
            const redirectUser = await FirebaseService.checkAuthResult();
            if (redirectUser) {
                await this.handleSuccessfulLogin(redirectUser);
                return this.user;
            }
        } catch (e) { console.error("Redirect Check Failed", e) }

        const savedUser = localStorage.getItem('app_user');
        if (savedUser) {
            this.user = JSON.parse(savedUser);
            // Auto login/refresh logic podria ir aqui en un futuro
        }
        return this.user;
    },

    async handleSuccessfulLogin(fbUser) {
        const mappedUser = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || fbUser.email.split('@')[0],
            email: fbUser.email,
            photoURL: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || fbUser.email)}&background=random`,
            provider: fbUser.providerId || 'firebase'
        };
        this.user = mappedUser;
        localStorage.setItem('app_user', JSON.stringify(this.user));

        // Al loguearte, descargar datos de la nube
        const cloudData = await FirebaseService.pullFromCloud(this.user.uid);
        if (cloudData) {
            // Importamos el state global
            const module = await import('../context/state.js');
            module.State.importWholeState(cloudData);
            window.showToast("Datos descargados de la Nube", "success");
        } else {
            window.showToast("Sesión iniciada exitosamente", "success");
        }
        window.router.navigate('dashboard');
    },

    async login(provider, credentials = null) {
        console.log(`Logging in with ${provider}...`);
        try {
            let fbUser;
            if (['google', 'facebook', 'microsoft'].includes(provider)) {
                fbUser = await FirebaseService.loginWithProvider(provider);
            } else if (provider === 'email' && credentials) {
                fbUser = await FirebaseService.loginWithEmail(credentials.email, credentials.password);
            }

            if (fbUser) {
                await this.handleSuccessfulLogin(fbUser);
                return this.user;
            }
            return null;
        } catch (error) {
            console.error(`Error de login con ${provider}:`, error);
            throw error;
        }
    },

    async register(email, password, name) {
        try {
            const fbUser = await FirebaseService.registerWithEmail(email, password, name);
            if (fbUser) {
                await this.handleSuccessfulLogin(fbUser);
                return this.user;
            }
            return null;
        } catch (error) {
            console.error("Error de registro:", error);
            throw error;
        }
    },

    async logout() {
        this.user = null;
        localStorage.removeItem('app_user');
        localStorage.removeItem('fb_user_active');
        await FirebaseService.logout();
        window.location.hash = 'login';
        window.location.reload();
    },

    isAuthenticated() {
        return !!this.user || !!localStorage.getItem('app_user');
    }
};
