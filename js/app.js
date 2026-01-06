import { State } from './context/state.js';
import { Dashboard } from './components/Dashboard.js';
import { Authorized } from './components/Authorized.js';
import { Outgoing } from './components/Outgoing.js';
import { Incoming } from './components/Incoming.js';
import { Reports } from './components/Reports.js';
import { DataManagement } from './components/DataManagement.js';

/**
 * Simple SPA Router
 */
class Router {
    constructor() {
        this.app = document.getElementById('main-content');
        this.navItems = document.querySelectorAll('.nav-item');
        this.init();
    }

    init() {
        this.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.getAttribute('data-page');
                this.navigate(page);
            });
        });

        // Default route
        this.navigate('dashboard');
    }

    navigate(page) {
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
        switch (page) {
            case 'dashboard':
                this.app.appendChild(Dashboard.render());
                break;
            case 'authorized':
                this.app.appendChild(Authorized.render());
                break;
            case 'outgoing':
                this.app.appendChild(Outgoing.render());
                break;
            case 'incoming':
                this.app.appendChild(Incoming.render());
                break;
            case 'reports':
                this.app.appendChild(Reports.render());
                break;
            case 'data':
                this.app.appendChild(DataManagement.render());
                break;
            default:
                this.app.appendChild(Dashboard.render());
        }

        // Re-initialize icons for new content
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}

// Global UI Utils
window.showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    // Hide error banner if we got here
    const errorBanner = document.getElementById('load-error');
    if (errorBanner) errorBanner.classList.add('hidden');

    new Router();
});
