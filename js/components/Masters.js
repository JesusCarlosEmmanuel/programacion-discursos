import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';
import { CSVUtils } from '../utils/csv.js';

export const Masters = {

    render() {
        const container = document.createElement('div');
        container.className = 'masters-view';

        container.innerHTML = `
            <div class="view-header" style="flex-wrap: wrap; gap: 0.5rem">
                <h2>Directorio de Congregaciones</h2>
                <div style="display: flex; gap: 0.5rem; flex: 1; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    <div class="tabs" style="margin: 0">
                        <button class="tab-btn active" id="tab-destinations">Destinos (Visitamos)</button>
                        <button class="tab-btn" id="tab-origins">Orígenes (Nos visitan)</button>
                    </div>
                    <label class="btn btn-secondary btn-small" style="cursor: pointer; margin: 0">
                        <i data-lucide="upload"></i> Importar CSV
                        <input type="file" id="masters-import-csv" accept=".csv, .txt" class="hidden">
                    </label>
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

        const importInput = container.querySelector('#masters-import-csv');
        if (importInput) importInput.addEventListener('change', (e) => this.handleImportCSV(e));

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
                        ${item.meeting_day ? `<p class="address-line"><i data-lucide="calendar"></i> Reunión: ${item.meeting_day} a las ${item.meeting_time || '--:--'}</p>` : ''}
                        
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
        let item = id ? list.find(i => i.id === id) : {
            name: '', address: '', meeting_day: '', meeting_time: '',
            contact_name: '', contact_phone: '', contact_email: '',
            contact2_name: '', contact2_phone: '', contact2_email: ''
        };

        // Load draft if new
        if (!id) {
            const draft = localStorage.getItem(`draft_master_${this.currentTab}`);
            if (draft) {
                try { item = { ...item, ...JSON.parse(draft) }; } catch (e) { }
            }
        }

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
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label>Día de Reunión</label>
                            <select id="m-meeting-day">
                                <option value="">Seleccionar día</option>
                                <option value="Lunes" ${item.meeting_day === 'Lunes' ? 'selected' : ''}>Lunes</option>
                                <option value="Martes" ${item.meeting_day === 'Martes' ? 'selected' : ''}>Martes</option>
                                <option value="Miércoles" ${item.meeting_day === 'Miércoles' ? 'selected' : ''}>Miércoles</option>
                                <option value="Jueves" ${item.meeting_day === 'Jueves' ? 'selected' : ''}>Jueves</option>
                                <option value="Viernes" ${item.meeting_day === 'Viernes' ? 'selected' : ''}>Viernes</option>
                                <option value="Sábado" ${item.meeting_day === 'Sábado' ? 'selected' : ''}>Sábado</option>
                                <option value="Domingo" ${item.meeting_day === 'Domingo' ? 'selected' : ''}>Domingo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Horario</label>
                            <input type="time" id="m-meeting-time" value="${item.meeting_time || ''}">
                        </div>
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

                    <div class="form-actions" style="margin-top: 1.5rem">
                        <button type="button" class="btn btn-secondary" onclick="Masters.closeModal()">Cancelar</button>
                        <button type="button" class="btn btn-secondary" onclick="Masters.clearForm()" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Limpiar</button>
                        <button type="submit" class="btn btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        const form = document.getElementById('master-form');
        form.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                id: id || crypto.randomUUID(),
                name: document.getElementById('m-name').value.trim(),
                address: document.getElementById('m-address').value.trim(),
                meeting_day: document.getElementById('m-meeting-day').value,
                meeting_time: document.getElementById('m-meeting-time').value,
                contact_name: document.getElementById('m-contact-name').value.trim(),
                contact_phone: PhoneUtils.validate(document.getElementById('m-contact-phone').value),
                contact_email: document.getElementById('m-contact-email').value,
                contact2_name: document.getElementById('m-contact2-name').value,
                contact2_phone: PhoneUtils.validate(document.getElementById('m-contact2-phone').value),
                contact2_email: document.getElementById('m-contact2-email').value,
            };

            State.saveMaster(this.currentTab, data);

            // Clear draft if successful
            if (!id) localStorage.removeItem(`draft_master_${this.currentTab}`);

            this.closeModal();
            window.showToast('Actualizado correctamente', 'success');
            this.renderList(document.querySelector('.masters-view'));
        };

        if (window.lucide) window.lucide.createIcons();

        // Draft saving logic
        const saveDraft = () => {
            if (id) return; // Only save drafts for new items
            const draft = {
                name: document.getElementById('m-name').value,
                address: document.getElementById('m-address').value,
                meeting_day: document.getElementById('m-meeting-day').value,
                meeting_time: document.getElementById('m-meeting-time').value,
                contact_name: document.getElementById('m-contact-name').value,
                contact_phone: document.getElementById('m-contact-phone').value,
                contact_email: document.getElementById('m-contact-email').value,
                contact2_name: document.getElementById('m-contact2-name').value,
                contact2_phone: document.getElementById('m-contact2-phone').value,
                contact2_email: document.getElementById('m-contact2-email').value,
            };
            localStorage.setItem(`draft_master_${this.currentTab}`, JSON.stringify(draft));
        };

        // Click outside to close and save draft
        window.onclick = (event) => {
            if (event.target === modal) {
                saveDraft();
                this.closeModal();
            }
        };

        // Save draft on input change
        form.addEventListener('input', saveDraft);
    },

    saveMaster(id) {
        // This function is now inlined into showMasterModal's form.onsubmit
        // Keeping it here for backward compatibility or if it's called elsewhere.
        // If not called elsewhere, it can be removed.
        const data = {
            id: id || crypto.randomUUID(),
            name: document.getElementById('m-name').value,
            address: document.getElementById('m-address').value,
            meeting_day: document.getElementById('m-meeting-day').value,
            meeting_time: document.getElementById('m-meeting-time').value,
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
    },

    clearForm() {
        if (confirm('¿Estás seguro de limpiar todo el formulario?')) {
            document.getElementById('master-form').reset();
            localStorage.removeItem(`draft_master_${this.currentTab}`);
        }
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
        window.onclick = null; // Remove the global click listener
    },

    handleImportCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const rows = CSVUtils.parseAuto(text);
                if (rows.length < 2) throw new Error("Archivo vacío");

                let parsedCount = 0;
                let isFirstRow = true;

                for (const row of rows) {
                    if (isFirstRow && row[0].toLowerCase().includes('congregaci')) { isFirstRow = false; continue; }
                    if (row.length < 2) continue;

                    const name = row[0].trim();
                    if (!name) continue;

                    const list = this.currentTab === 'destinations' ? State.destinations : State.origins;
                    // Check if already exists
                    if (list.find(i => i.name.toLowerCase() === name.toLowerCase())) continue;

                    let contact_name = '';
                    let contact_phone = '';
                    let address = '';

                    if (this.currentTab === 'destinations' && row.length >= 3) {
                        // Expected: Congregación | Contacto Congregación | Domicilio ...
                        const rawContact = row[1];
                        address = row[2];

                        // Contact usually comes as "Name \n Phone" or "Name Phone"
                        // Try to extract phone number by searching for digits
                        const phoneMatch = rawContact.match(/(\+?\d[\d\s-]{7,}\d)/);
                        if (phoneMatch) {
                            contact_phone = PhoneUtils.validate(phoneMatch[1].trim());
                            contact_name = rawContact.replace(phoneMatch[1], '').trim().replace(/[\n\r]+$/, '').trim();
                        } else {
                            contact_name = rawContact.trim();
                        }
                    } else {
                        // Expected: Congregación | No. Telefónico
                        contact_phone = PhoneUtils.validate(row[1] ? row[1].trim() : '');
                    }

                    const data = {
                        id: crypto.randomUUID(),
                        name,
                        address,
                        contact_name,
                        contact_phone,
                        contact_email: '',
                        contact2_name: '',
                        contact2_phone: '',
                        contact2_email: ''
                    };

                    State.saveMaster(this.currentTab, data, false); // Disable trigger if bulk, but safe to use
                    parsedCount++;
                }

                this.renderList(document.querySelector('.masters-view'));
                window.showToast(`Se importaron ${parsedCount} congregaciones exitosamente`, 'success');

            } catch (error) {
                console.error("Error importing CSV:", error);
                window.showToast('Error al importar el archivo CSV', 'danger');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }
};

window.Masters = Masters;
