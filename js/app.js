import { State } from './context/state.js';
import { Dashboard } from './components/Dashboard.js';
import { Authorized } from './components/Authorized.js';
import { Outgoing } from './components/Outgoing.js';
import { Incoming } from './components/Incoming.js';
import { Reports } from './components/Reports.js';
import { DataManagement } from './components/DataManagement.js';
import { Masters } from './components/Masters.js';
import { Calendar } from './components/Calendar.js';
import { Login } from './components/Login.js';
import { AuthService } from './services/AuthService.js';

// Global exposure for debugging and inline event handlers
window.State = State;
window.Dashboard = Dashboard;
window.Authorized = Authorized;
window.Outgoing = Outgoing;
window.Incoming = Incoming;
window.Reports = Reports;
window.DataManagement = DataManagement;
window.Masters = Masters;
window.Calendar = Calendar;
window.Login = Login;
window.AuthService = AuthService;

/**
 * Simple SPA Router
 */
class Router {
    constructor() {
        this.app = document.getElementById('main-content');
        this.navItems = document.querySelectorAll('.nav-item');
        this.routes = {
            dashboard: Dashboard,
            authorized: Authorized,
            outgoing: Outgoing,
            incoming: Incoming,
            calendar: Calendar,
            reports: Reports,
            data: DataManagement,
            masters: Masters,
            login: Login
        };
        window.router = this;

        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.navigate(e.state.page, false);
            } else {
                this.navigate('dashboard', false);
            }
        });

        this.init();
    }

    init() {
        try {
            const fullPath = window.location.hash.replace('#', '');
            const [page, query] = fullPath.split('?');
            const initialPage = this.routes[page] ? page : 'dashboard';
            this.navigate(fullPath || 'dashboard', true);
        } catch (e) {
            console.error("Router init failed:", e);
        }
    }

    navigate(page, addToHistory = true) {
        try {
            if (addToHistory) {
                history.pushState({ page }, '', `#${page}`);
            }

            // Update Nav UI
            const navButtons = document.querySelectorAll('.nav-btn');
            navButtons.forEach(btn => {
                const id = btn.id;
                if (id === `nav-${page}`) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Clear content
            this.app.innerHTML = '';

            // Render Page
            const [pageId, queryStr] = page.split('?');
            const params = new URLSearchParams(queryStr);
            const Component = this.routes[pageId] || this.routes.dashboard;

            if (Component && Component.render) {
                this.app.appendChild(Component.render(params));
            }

            // Re-initialize icons
            if (window.lucide) window.lucide.createIcons();
        } catch (e) {
            console.error(`Error navigating to ${page}:`, e);
            this.app.innerHTML = `<div class="card error" style="padding:20px; color:#ef4444">
                <h3>⚠️ Error al cargar la página</h3>
                <p>${e.message}</p>
                <button onclick="window.hardReset()" style="margin-top:10px" class="btn btn-danger">Limpiar y Reiniciar</button>
            </div>`;
        }
    }
}

// Global UI Utils
window.showChoiceModal = ({ title, message, options }) => {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        modal.innerHTML = `
            <div class="modal-content card" style="max-width: 500px; width: 90%; animation: slideDown 0.3s ease-out;">
                <div style="display:flex; align-items:center; gap:12px; margin-bottom:1rem; color:var(--primary)">
                    <i data-lucide="alert-triangle" style="width:24px; height:24px"></i>
                    <h3 style="margin:0">${title}</h3>
                </div>
                <p style="margin-bottom:2rem; font-size:1.1rem; line-height:1.5">${message}</p>
                <div style="display:flex; flex-direction:column; gap:10px">
                    ${options.map(opt => `
                        <button class="btn ${opt.class || 'btn-secondary'}" onclick="window._modalResolve('${opt.value}')" style="justify-content:center; padding: 12px; font-weight:600">
                            ${opt.label}
                        </button>
                    `).join('')}
                    <button class="btn btn-secondary" onclick="window._modalResolve('cancel')" style="justify-content:center; padding: 12px; opacity:0.7">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        window._modalResolve = (val) => {
            modal.classList.add('hidden');
            delete window._modalResolve;
            resolve(val);
        };
    });
};

window.showToast = (msg, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

window.showUndo = (msg, callback) => {
    const container = document.getElementById('undo-notification');
    container.classList.remove('hidden');
    container.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px">
            <i data-lucide="trash-2"></i>
            <span>${msg}</span>
        </div>
        <div style="display:flex; align-items:center; gap:15px">
            <button class="btn-undo" id="btn-undo-action">DESHACER</button>
            <div class="undo-timer" id="undo-timer">4</div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();

    let timeLeft = 5;
    const timer = setInterval(() => {
        timeLeft--;
        const timerEl = document.getElementById('undo-timer');
        if (timerEl) timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            container.classList.add('hidden');
        }
    }, 1000);

    const undoBtn = document.getElementById('btn-undo-action');
    undoBtn.onclick = () => {
        clearInterval(timer);
        container.classList.add('hidden');
        callback();
        window.showToast('Acción revertida', 'info');
    };
};

import { OneDriveService } from './services/OneDriveService.js';

// Initialize OneDrive connection if account exists
OneDriveService.init();

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Router();
    });
} else {
    new Router();
}

// Safe function to clear only cache and service worker
window.cleanCache = () => {
    if (confirm('¿Limpiar archivos temporales y reiniciar? Tus datos (discursantes y agendas) NO se borrarán.')) {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        // Clear Cache API shells
        if ('caches' in window) {
            caches.keys().then(names => {
                for (let name of names) caches.delete(name);
            });
        }
        window.location.reload(true);
    }
};

// Emergency function to clear EVERYTHING
window.hardReset = () => {
    if (confirm('⚠️ ¡ADVERTENCIA CRÍTICA! ⚠️\n\n¿Estás SEGURO de que deseas RESTABLECER DE FÁBRICA?\n\nEsto BORRARÁ PERMANENTEMENTE todos tus discursantes, congregaciones y toda la programación agendada. No se puede deshacer.')) {
        localStorage.clear();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        if ('caches' in window) {
            caches.keys().then(names => {
                for (let name of names) caches.delete(name);
            });
        }
        window.location.reload(true);
    }
};
