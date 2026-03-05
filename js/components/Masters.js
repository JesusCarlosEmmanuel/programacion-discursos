import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';
import { CSVUtils } from '../utils/csv.js';

export const Masters = {
    selectedIds: new Set(),

    render() {
        const container = document.createElement('div');
        container.className = 'masters-view';

        container.innerHTML = `
            <div id="selection-bar" class="selection-bar hidden">
                <span id="selection-count">0 seleccionados</span>
                <button class="btn btn-danger btn-small" onclick="Masters.handleBulkDelete()">
                    <i data-lucide="trash-2"></i> Borrar
                </button>
            </div>
            <div class="view-header" style="flex-wrap: wrap; gap: 0.5rem">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="select-all-masters" title="Seleccionar todos">
                    <h2>Directorio de Congregaciones</h2>
                </div>
                <div style="display: flex; gap: 0.5rem; flex: 1; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
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

        this.initEvents(container);
        this.renderList(container);
        return container;
    },

    initEvents(container) {
        container.querySelector('#btn-add-master').addEventListener('click', () => {
            this.showMasterModal();
        });

        const importInput = container.querySelector('#masters-import-csv');
        if (importInput) importInput.addEventListener('change', (e) => this.handleImportCSV(e));

        const selectAll = container.querySelector('#select-all-masters');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.toggleAll(e.target.checked));
        }

        if (window.lucide) window.lucide.createIcons();
    },


    renderList(container) {
        const content = container.querySelector('#masters-content');

        // Merge without exact duplicates by ID
        const combined = [...State.destinations];
        State.origins.forEach(o => {
            if (!combined.find(c => c.id === o.id)) combined.push(o);
        });

        // Sort alphabetically
        const list = combined.sort((a, b) => a.name.localeCompare(b.name));

        if (list.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="map-pin"></i>
                    <p>No hay registros en esta categoría.</p>
                </div>
            `;
        } else {
            content.innerHTML = list.map(item => {
                const isSelected = this.selectedIds.has(item.id);
                return `
                <div class="card master-card ${isSelected ? 'selected' : ''}" data-id="${item.id}">
                    <div class="card-selection">
                        <input type="checkbox" class="bulk-check" data-id="${item.id}" onchange="Masters.toggleSelection('${item.id}')" ${isSelected ? 'checked' : ''}>
                    </div>
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
                                ${item.contact_phone ? `
                                <div style="display:flex; gap:0.5rem; margin-top:0.5rem" onclick="event.stopPropagation()">
                                    <a href="tel:${item.contact_phone}" class="btn btn-primary btn-small" style="flex:1; justify-content:center; text-decoration:none; padding:4px;"><i data-lucide="phone" style="width:14px; height:14px"></i> Llamar</a>
                                    <button class="btn btn-secondary btn-small" onclick="window.open('https://wa.me/${item.contact_phone.replace(/\\D/g, '')}', '_blank')" style="flex:1; justify-content:center; padding:4px;"><i data-lucide="message-square" style="width:14px; height:14px"></i> Whats</button>
                                </div>
                                ` : ''}
                            </div>
                            ${item.contact2_name ? `
                            <div class="contact-item">
                                <span class="contact-label">Contacto 2:</span>
                                <strong>${item.contact2_name}</strong>
                                <p><i data-lucide="phone"></i> ${item.contact2_phone || '---'}</p>
                                ${item.contact2_email ? `<p><i data-lucide="mail"></i> ${item.contact2_email}</p>` : ''}
                                ${item.contact2_phone ? `
                                <div style="display:flex; gap:0.5rem; margin-top:0.5rem" onclick="event.stopPropagation()">
                                    <a href="tel:${item.contact2_phone}" class="btn btn-primary btn-small" style="flex:1; justify-content:center; text-decoration:none; padding:4px;"><i data-lucide="phone" style="width:14px; height:14px"></i> Llamar</a>
                                    <button class="btn btn-secondary btn-small" onclick="window.open('https://wa.me/${item.contact2_phone.replace(/\\D/g, '')}', '_blank')" style="flex:1; justify-content:center; padding:4px;"><i data-lucide="message-square" style="width:14px; height:14px"></i> Whats</button>
                                </div>
                                ` : ''}
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
            `;
            }).join('');
        }

        if (window.lucide) window.lucide.createIcons();
        this.updateSelectionBar();
    },

    toggleSelection(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateSelectionBar();
        const card = document.querySelector(`.master-card[data-id="${id}"]`);
        if (card) card.classList.toggle('selected');

        // Update Select All checkbox state
        const combinedCount = State.destinations.length + State.origins.filter(o => !State.destinations.find(c => c.id === o.id)).length;
        const selectAll = document.getElementById('select-all-masters');
        if (selectAll) selectAll.checked = this.selectedIds.size === combinedCount && combinedCount > 0;
    },

    toggleAll(checked) {
        if (checked) {
            const combined = [...State.destinations];
            State.origins.forEach(o => {
                if (!combined.find(c => c.id === o.id)) combined.push(o);
            });
            combined.forEach(item => this.selectedIds.add(item.id));
        } else {
            this.selectedIds.clear();
        }
        this.renderList(document.querySelector('.masters-view'));
    },

    updateSelectionBar() {
        const bar = document.getElementById('selection-bar');
        const count = document.getElementById('selection-count');
        if (!bar || !count) return;

        if (this.selectedIds.size > 0) {
            bar.classList.remove('hidden');
            count.innerText = `${this.selectedIds.size} seleccionados`;
        } else {
            bar.classList.add('hidden');
        }
    },

    handleBulkDelete() {
        if (!confirm(`¿Estás seguro de que deseas eliminar ${this.selectedIds.size} congregaciones seleccionadas?`)) return;
        const idsToDelete = Array.from(this.selectedIds);
        this.executeBulkDelete(idsToDelete);
        this.selectedIds.clear();
        const selectAll = document.getElementById('select-all-masters');
        if (selectAll) selectAll.checked = false;
    },

    executeBulkDelete(ids) {
        ids.forEach(id => {
            const wasOrigin = State.origins.some(o => o.id === id);
            if (wasOrigin) {
                State.origins = State.origins.filter(d => d.id !== id);
                State.saveToStorage('speaker_app_origins', State.origins);
            }
            State.destinations = State.destinations.filter(d => d.id !== id);
            State.saveToStorage('speaker_app_destinations', State.destinations);
        });
        this.renderList(document.querySelector('.masters-view'));
        window.showToast('Registros eliminados', 'success');
    },

    showMasterModal(id = null) {
        // Merge without exact duplicates by ID to find the item to edit
        const combined = [...State.destinations];
        State.origins.forEach(o => {
            if (!combined.find(c => c.id === o.id)) combined.push(o);
        });

        let item = id ? combined.find(i => i.id === id) : {
            name: '', address: '', meeting_day: '', meeting_time: '',
            contact_name: '', contact_phone: '', contact_email: '',
            contact2_name: '', contact2_phone: '', contact2_email: ''
        };

        // Load draft if new
        if (!id) {
            const draft = localStorage.getItem(`draft_master`);
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

            // We save everything to 'destinations' to keep a unified list going forward.
            // If the item previously existed in 'origins', we should ideally remove it from there 
            // but `State.saveMaster` might not know how to cross-delete easily without modifying State.js.
            // However, saving to 'destinations' is safer.
            const wasOrigin = State.origins.some(o => o.id === data.id);
            if (wasOrigin) {
                State.saveMaster('origins', data); // Save back to origins if it came from there to avoid duplicates in the other array
            } else {
                State.saveMaster('destinations', data);
            }

            // Clear draft if successful
            if (!id) localStorage.removeItem(`draft_master`);

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
            localStorage.setItem(`draft_master`, JSON.stringify(draft));
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
        // Obsolete function, kept for backward compatibility if called manually
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

        const wasOrigin = State.origins.some(o => o.id === data.id);
        if (wasOrigin) {
            State.saveMaster('origins', data);
        } else {
            State.saveMaster('destinations', data);
        }

        document.getElementById('modal-container').classList.add('hidden');
        window.showToast('Actualizado correctamente', 'success');
        this.renderList(document.querySelector('.masters-view'));
    },

    deleteMaster(id) {
        if (!confirm('¿Eliminar esta congregación?')) return;

        // Try to find in both and delete
        const wasOrigin = State.origins.some(o => o.id === id);
        const backup = wasOrigin
            ? State.origins.find(i => i.id === id)
            : State.destinations.find(i => i.id === id);

        if (wasOrigin) {
            State.origins = State.origins.filter(d => d.id !== id);
            State.saveToStorage('speaker_app_origins', State.origins);
        }

        State.destinations = State.destinations.filter(d => d.id !== id);
        State.saveToStorage('speaker_app_destinations', State.destinations);

        this.renderList(document.querySelector('.masters-view'));

        window.showUndo('Eliminado', () => {
            if (wasOrigin) {
                State.origins.push(backup);
                State.saveToStorage('speaker_app_origins', State.origins);
            } else {
                State.destinations.push(backup);
                State.saveToStorage('speaker_app_destinations', State.destinations);
            }
            this.renderList(document.querySelector('.masters-view'));
        });
    },

    clearForm() {
        if (confirm('¿Estás seguro de limpiar todo el formulario?')) {
            document.getElementById('master-form').reset();
            localStorage.removeItem('draft_master');
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

                    // Unified check for existence
                    const exists = [...State.destinations, ...State.origins].find(i => i.name.toLowerCase() === name.toLowerCase());
                    if (exists) continue;

                    let contact_name = '';
                    let contact_phone = '';
                    let address = '';

                    // Try to be smart about the format (Congregación | Contacto | Dirección)
                    if (row.length >= 3) {
                        const rawContact = row[1];
                        address = row[2];
                        const phoneMatch = rawContact.match(/(\+?\d[\d\s-]{7,}\d)/);
                        if (phoneMatch) {
                            contact_phone = PhoneUtils.validate(phoneMatch[1].trim());
                            contact_name = rawContact.replace(phoneMatch[1], '').trim().replace(/[\n\r]+$/, '').trim();
                        } else {
                            contact_name = rawContact.trim();
                        }
                    } else {
                        contact_phone = PhoneUtils.validate(row[1] ? row[1].trim() : '');
                    }

                    const data = {
                        id: crypto.randomUUID(),
                        name, address, contact_name, contact_phone,
                        contact_email: '', contact2_name: '', contact2_phone: '', contact2_email: ''
                    };

                    State.saveMaster('destinations', data, false);
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
