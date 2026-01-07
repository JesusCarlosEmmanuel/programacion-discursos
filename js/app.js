import { State } from './context/state.js';
import { Dashboard } from './components/Dashboard.js';
import { Authorized } from './components/Authorized.js';
import { Outgoing } from './components/Outgoing.js';
import { Incoming } from './components/Incoming.js';
import { Reports } from './components/Reports.js';
import { DataManagement } from './components/DataManagement.js';
import { Masters } from './components/Masters.js';

// Global exposure for debugging and inline event handlers
window.State = State;
window.Dashboard = Dashboard;
window.Authorized = Authorized;
window.Outgoing = Outgoing;
window.Incoming = Incoming;
window.Reports = Reports;
window.DataManagement = DataManagement;
window.Masters = Masters;

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
            reports: Reports,
            data: DataManagement,
            masters: Masters
        };
        window.router = this;
        this.init();
    }

    init() {
        try {
            this.navigate('dashboard');
        } catch (e) {
            console.error("Router init failed:", e);
        }
    }

    navigate(page) {
        try {
            // Update Nav UI
            this.navItems.forEach(item => {
                if (item.getAttribute('data-page') === page) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            // Clear content
            this.app.innerHTML = '';

            // Render Page
            const Component = this.routes[page] || this.routes.dashboard;
            if (Component && Component.render) {
                this.app.appendChild(Component.render());
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

    let timeLeft = 4;
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

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new Router();
    });
} else {
    new Router();
}

// Emergency function to clear cache and state
window.hardReset = () => {
    if (confirm('¿BORRAR TODO? Esto eliminará todos los datos y reiniciará la app.')) {
        localStorage.clear();
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister();
                }
            });
        }
        window.location.reload(true);
    }
};
