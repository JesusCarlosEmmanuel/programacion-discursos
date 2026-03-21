import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    signInWithRedirect, 
    getRedirectResult, 
    GoogleAuthProvider, 
    FacebookAuthProvider,
    OAuthProvider,
    signOut, 
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
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
            if (error.code === 'auth/unauthorized-domain') {
                window.showToast("Error: Dominio no autorizado en Firebase.", "danger");
            }
        }
        return null;
    },

    async loginWithProvider(providerName) {
        if (!this.init()) return null;
        try {
            let provider;
            if (providerName === 'google') provider = new GoogleAuthProvider();
            else if (providerName === 'facebook') provider = new FacebookAuthProvider();
            else if (providerName === 'microsoft') provider = new OAuthProvider('microsoft.com');
            else throw new Error("Proveedor no soportado");

            provider.setCustomParameters({ prompt: 'select_account' });

            const isMobileOrPwa = window.innerWidth < 768 || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

            if (isMobileOrPwa) {
                log(`Executing Redirect Auth for ${providerName}`);
                window.showToast(`Conectando con ${providerName}...`, "info");
                await signInWithRedirect(auth, provider);
                return null; // Redirecting
            } else {
                log(`Executing Popup Auth for ${providerName}`);
                const result = await signInWithPopup(auth, provider);
                return result.user;
            }
        } catch (error) {
            log("Provider Login Error", error);
            window.showToast(`Error: ${error.message}`, "danger");
            throw error;
        }
    },

    async registerWithEmail(email, password, displayName) {
        if (!this.init()) return null;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }
            return userCredential.user;
        } catch (error) {
            log("Register Error", error);
            window.showToast(`Error de registro: ${error.code}`, "danger");
            throw error;
        }
    },

    async loginWithEmail(email, password) {
        if (!this.init()) return null;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (error) {
            log("Email Login Error", error);
            window.showToast(`Error: Credenciales inválidas`, "danger");
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
