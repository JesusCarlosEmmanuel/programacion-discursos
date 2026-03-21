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
            displayName: fbUser.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName)}`,
            provider: 'google'
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

        if (provider === 'google') {
            try {
                const fbUser = await FirebaseService.loginWithGoogle();
                if (fbUser) {
                    await this.handleSuccessfulLogin(fbUser);
                    return this.user;
                }
                return null;
            } catch (error) {
                console.error("Firebase Auth Falló:", error);
                throw error;
            }
        }

        if (provider === 'email') {
            // Placeholder for Firebase Email Auth
            window.showToast("El registro por correo estará disponible pronto.", "info");
            return null;
        }

        if (['microsoft', 'facebook', 'instagram'].includes(provider)) {
            window.showToast(`El inicio de sesión con ${provider} estará disponible próximamente. Por favor usa Google.`, "info");
            return null;
        }

        return null;
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
