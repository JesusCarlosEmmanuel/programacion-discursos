import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

export const firebaseConfig = {
    apiKey: "AIzaSyBp3veIYIYi4mrKBUEBZuoMYE2uCq-NHF4",
    authDomain: "programaciondiscursos.firebaseapp.com",
    projectId: "programaciondiscursos",
    storageBucket: "programaciondiscursos.firebasestorage.app",
    messagingSenderId: "261224265602",
    appId: "1:261224265602:web:559120c91568f60aaa419b"
};

let app, auth, db;
let isInitialized = false;

// Logger helper to help Emmanuel see what's going on in mobile
const log = (msg, obj = '') => {
  console.log(`[Firebase] ${msg}`, obj);
  // Optional: You could show these in a specific UI debug panel
};

export const FirebaseService = {
    init() {
        if (isInitialized) return true;
        try {
            log("Initializing Firebase...");
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            isInitialized = true;
            
            // Monitor session in real time
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    log("User detected by Firebase Core", user.email);
                    // Sync local state profile if needed
                    localStorage.setItem('fb_user_active', 'true');
                } else {
                    log("No active Firebase session");
                    localStorage.removeItem('fb_user_active');
                }
            });

            return true;
        } catch (e) {
            log("Initialization Error", e);
            return false;
        }
    },

    async checkAuthResult() {
        this.init();
        try {
            log("Checking Redirect Result...");
            const result = await getRedirectResult(auth);
            if (result && result.user) {
                log("Redirect Result Success", result.user.email);
                return result.user;
            }
            log("No redirect result found");
        } catch (error) {
            log("Error in Redirect Result", error.message);
            // Si el error es sobre dominios no autorizados, esto aparecerá en consola
            if (error.code === 'auth/unauthorized-domain') {
                window.showToast("Error: Dominio no autorizado en Firebase. Añade github.io a la consola.", "danger");
            }
        }
        return null;
    },

    async loginWithGoogle() {
        if (!this.init()) {
            window.showToast("Error al inicializar servidor.", "danger");
            return null;
        }
        try {
            log("Starting Google Login...");
            const provider = new GoogleAuthProvider();
            
            // Forzamos el prompt de selección de cuenta siempre para evitar "congelamientos" por auto-login fallido
            provider.setCustomParameters({ prompt: 'select_account' });

            const isMobile = window.innerWidth < 768 || /Android|iPhone/i.test(navigator.userAgent);
            const isPwa = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

            if (isMobile || isPwa) {
                log("Executing Redirect Auth (Mobile/PWA)");
                window.showToast("Conectando con Google...", "info");
                // Importante: No retornamos nada, dejamos que la página se vaya
                await signInWithRedirect(auth, provider);
            } else {
                log("Executing Popup Auth (Desktop)");
                const result = await signInWithPopup(auth, provider);
                log("Popup Login Success", result.user.email);
                return result.user;
            }
        } catch (error) {
            log("Login Error", error);
            window.showToast(`Error: ${error.message}`, "danger");
            throw error;
        }
    },

    async logout() {
        if (auth) {
            log("Logging out...");
            await signOut(auth);
        }
    },

    async syncToCloud(uid, stateData) {
        if (!isInitialized || !uid) return;
        try {
            const userRef = doc(db, "users", uid);
            await setDoc(userRef, {
                data: JSON.stringify(stateData),
                lastSync: new Date().toISOString()
            });
            log("Cloud Sync Success");
        } catch (e) {
            log("Cloud Sync Error", e);
        }
    },

    async pullFromCloud(uid) {
        if (!isInitialized || !uid) return null;
        try {
            log("Pulling from cloud...");
            const userRef = doc(db, "users", uid);
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                log("Pull Success");
                return JSON.parse(docSnap.data().data);
            }
            log("No data found in cloud for UID", uid);
            return null;
        } catch (e) {
            log("Pull Error", e);
            return null;
        }
    }
};
