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

    async login(provider) {
        console.log(`Logging in with ${provider}...`);

        if (provider === 'google') {
            try {
                const fbUser = await FirebaseService.loginWithGoogle();
                if (fbUser) {
                    // Solo para escritorio/Popups. En móviles la redirección se atrapa en init()
                    await this.handleSuccessfulLogin(fbUser);
                    return this.user;
                }
            } catch (error) {
                console.error("Firebase Auth Falló:", error);
                throw error;
            }
        }

        if (provider === 'microsoft' || provider === 'github' || provider === 'facebook') {
            window.showToast("Este método estará disponible pronto. Por favor usa 'Continuar con Google'.", "info");
            return null;
        }

        return null;
    },

    async logout() {
        this.user = null;
        localStorage.removeItem('app_user');
        await FirebaseService.logout();
        window.location.reload();
    },

    isAuthenticated() {
        return !!this.user;
    }
};
