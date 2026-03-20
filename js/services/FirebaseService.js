/**
 * FirebaseService.js
 * Handles Authentication and Firestore Database Sync.
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
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

export const FirebaseService = {
    init() {
        if (firebaseConfig.apiKey === "PENDIENTE") {
            console.log("Firebase no configurado aún. Operando en Modo Local estricto.");
            return false;
        }
        try {
            if (!app) {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);
                isInitialized = true;
            }
            return true;
        } catch (e) {
            console.error("Error al inicializar Firebase:", e);
            return false;
        }
    },

    async loginWithGoogle() {
        if (!this.init()) {
            window.showToast("Firebase no está configurado. Ve a Ajustes > Modo Desarrollador o espera la configuración.", "warning");
            return null;
        }
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            return result.user; // uid, displayName, email, photoURL
        } catch (error) {
            console.error("Error Login Google:", error);
            throw error;
        }
    },

    async logout() {
        if (auth) {
            await signOut(auth);
        }
    },

    /**
     * Sincroniza todo el State local hacia Firestore bajo el UID del usuario
     */
    async syncToCloud(uid, stateData) {
        if (!isInitialized || !uid) return;
        try {
            const userRef = doc(db, "users", uid);
            // Empaquetar todo el estado en un solo documento
            await setDoc(userRef, {
                data: JSON.stringify(stateData),
                lastSync: new Date().toISOString()
            });
            console.log("Datos sincronizados en Firebase exitosamente.");
            localStorage.setItem('last_cloud_sync', new Date().toLocaleString());
        } catch (e) {
            console.error("Error subiendo datos a Firebase:", e);
        }
    },

    /**
     * Descarga los datos de Firestore al State local (Ocurre tras el login exitoso)
     */
    async pullFromCloud(uid) {
        if (!isInitialized || !uid) return null;
        try {
            const userRef = doc(db, "users", uid);
            const docSnap = await getDoc(userRef);

            if (docSnap.exists()) {
                const dataStr = docSnap.data().data;
                console.log("Datos descargados de Firebase exitosamente.");
                return JSON.parse(dataStr);
            } else {
                console.log("No hay datos previos en la nube para este usuario. Es una cuenta nueva.");
                return null;
            }
        } catch (e) {
            console.error("Error descargando datos de Firebase:", e);
            return null;
        }
    }
};
