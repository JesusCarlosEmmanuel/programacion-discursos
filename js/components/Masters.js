import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';

export const Masters = {

    render() {
        const container = document.createElement('div');
        container.className = 'masters-view';

        container.innerHTML = `
            <div class="view-header">
                <h2>Directorio de Congregaciones</h2>
                <div class="tabs">
                    <button class="tab-btn active" id="tab-destinations">Destinos (Visitamos)</button>
                    <button class="tab-btn" id="tab-origins">Orígenes (Nos visitan)</button>
                </div>
            </div>

            <div id="masters-content">
                <!-- Content will be injected here -->
            </div>

            <div class="fab-container">
                <button class="btn-fab" id="btn-add-master">
                    <i data-lucide="plus"></i>
                </button>
            </div>
        `;

        this.currentTab = 'destinations';
        this.initEvents(container);
        this.renderList(container);
        return container;
    },

    initEvents(container) {
        container.querySelector('#tab-destinations').addEventListener('click', () => {
            this.switchTab(container, 'destinations');
        });
        container.querySelector('#tab-origins').addEventListener('click', () => {
            this.switchTab(container, 'origins');
        });
        container.querySelector('#btn-add-master').addEventListener('click', () => {
            this.showMasterModal();
        });

        if (window.lucide) window.lucide.createIcons();
    },

    switchTab(container, tab) {
        this.currentTab = tab;
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelector(`#tab-${tab}`).classList.add('active');
        this.renderList(container);
    },

    renderList(container) {
        const content = container.querySelector('#masters-content');
        const list = this.currentTab === 'destinations' ? State.destinations : State.origins;

        if (list.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="map-pin"></i>
                    <p>No hay registros en esta categoría.</p>
                </div>
            `;
        } else {
            content.innerHTML = list.map(item => `
                <div class="card master-card" data-id="${item.id}">
                    <div class="master-info" onclick="Masters.showMasterModal('${item.id}')">
                        <div class="master-card-header">
                            <strong>${item.name}</strong>
                        </div>
                        <p class="address-line"><i data-lucide="map-pin"></i> ${item.address || 'Sin dirección'}</p>
                        
                        <div class="contacts-grid">
                            <div class="contact-item">
                                <span class="contact-label">Contacto 1:</span>
                                <strong>${item.contact_name || 'Sin nombre'}</strong>
                                <p><i data-lucide="phone"></i> ${item.contact_phone || '---'}</p>
                                ${item.contact_email ? `<p><i data-lucide="mail"></i> ${item.contact_email}</p>` : ''}
                            </div>
                            ${item.contact2_name ? `
                            <div class="contact-item">
                                <span class="contact-label">Contacto 2:</span>
                                <strong>${item.contact2_name}</strong>
                                <p><i data-lucide="phone"></i> ${item.contact2_phone || '---'}</p>
                                ${item.contact2_email ? `<p><i data-lucide="mail"></i> ${item.contact2_email}</p>` : ''}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="master-actions">
                        <button class="btn-icon" onclick="Masters.showMasterModal('${item.id}')">
                            <i data-lucide="edit-3"></i>
                        </button>
                        <button class="btn-icon error" onclick="Masters.deleteMaster('${item.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }

        if (window.lucide) window.lucide.createIcons();
    },

    showMasterModal(id = null) {
        const list = this.currentTab === 'destinations' ? State.destinations : State.origins;
        const item = id ? list.find(i => i.id === id) : {
            name: '', address: '',
            contact_name: '', contact_phone: '', contact_email: '',
            contact2_name: '', contact2_phone: '', contact2_email: ''
        };

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal-content card">
                <h3>${id ? 'Editar' : 'Nueva'} Congregación</h3>
                <form id="master-form">
                    <div class="form-group">
                        <label>Nombre de la Congregación</label>
                        <input type="text" id="m-name" value="${item.name}" required placeholder="Ej: Central">
                    </div>
                    <div class="form-group">
                        <label>Dirección / Ubicación</label>
                        <input type="text" id="m-address" value="${item.address || ''}" placeholder="Calle, número, ciudad">
                    </div>
                    
                    <div class="form-section-title">Contacto Principal</div>
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="m-contact-name" value="${item.contact_name || ''}" placeholder="Nombre completo">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="m-contact-phone" value="${item.contact_phone || ''}" placeholder="WhatsApp">
                        </div>
                        <div class="form-group">
                            <label>Correo</label>
                            <input type="email" id="m-contact-email" value="${item.contact_email || ''}" placeholder="email@ejemplo.com">
                        </div>
                    </div>

                    <div class="form-section-title">2° Contacto (Opcional)</div>
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="m-contact2-name" value="${item.contact2_name || ''}" placeholder="Nombre completo">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="m-contact2-phone" value="${item.contact2_phone || ''}" placeholder="WhatsApp">
                        </div>
                        <div class="form-group">
                            <label>Correo</label>
                            <input type="email" id="m-contact2-email" value="${item.contact2_email || ''}" placeholder="email@ejemplo.com">
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-container').classList.add('hidden')">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        document.getElementById('master-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveMaster(id);
        });
    },

    saveMaster(id) {
        const data = {
            id: id || crypto.randomUUID(),
            name: document.getElementById('m-name').value,
            address: document.getElementById('m-address').value,
            contact_name: document.getElementById('m-contact-name').value,
            contact_phone: PhoneUtils.validate(document.getElementById('m-contact-phone').value),
            contact_email: document.getElementById('m-contact-email').value,
            contact2_name: document.getElementById('m-contact2-name').value,
            contact2_phone: PhoneUtils.validate(document.getElementById('m-contact2-phone').value),
            contact2_email: document.getElementById('m-contact2-email').value,
        };

        State.saveMaster(this.currentTab, data);

        document.getElementById('modal-container').classList.add('hidden');
        window.showToast('Actualizado correctamente', 'success');
        this.renderList(document.querySelector('.masters-view'));
    },

    deleteMaster(id) {
        if (!confirm('¿Eliminar esta congregación?')) return;

        const list = this.currentTab === 'destinations' ? State.destinations : State.origins;
        const backup = list.find(i => i.id === id);

        State.deleteMaster(this.currentTab, id);

        this.renderList(document.querySelector('.masters-view'));

        window.showUndo('Eliminado', () => {
            State.saveMaster(this.currentTab, backup);
            this.renderList(document.querySelector('.masters-view'));
        });
    }
};

window.Masters = Masters;
