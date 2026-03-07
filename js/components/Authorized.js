import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';
import { CSVUtils } from '../utils/csv.js';

export const Authorized = {

    selectedIds: new Set(),

    render() {
        const container = document.createElement('div');
        container.className = 'authorized-view';

        container.innerHTML = `
            <div id="selection-bar" class="selection-bar hidden">
                <span id="selection-count">0 seleccionados</span>
                <button class="btn btn-danger btn-small" onclick="Authorized.handleBulkDelete()">
                    <i data-lucide="trash-2"></i> Borrar
                </button>
            </div>
            <div class="view-header" style="flex-wrap: wrap; gap: 0.5rem">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="select-all-speakers" title="Seleccionar todos">
                    <h2>Discursantes Autorizados</h2>
                </div>
                <div style="display: flex; gap: 0.5rem; flex: 1; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    <div class="search-box">
                        <i data-lucide="search"></i>
                        <input type="text" id="speaker-search" placeholder="Buscar hermano...">
                    </div>
                    <label class="btn btn-secondary btn-small" style="cursor: pointer; margin: 0">
                        <i data-lucide="upload"></i> Importar CSV
                        <input type="file" id="authorized-import-csv" accept=".csv, .txt" class="hidden">
                    </label>
                    <button class="btn btn-secondary btn-small" id="btn-share-catalog" title="Compartir Lista de Temas">
                        <i data-lucide="share-2"></i> Temas
                    </button>
                    <button class="btn btn-secondary btn-small" id="btn-share-availability" title="Compartir Disponibilidad">
                        <i data-lucide="calendar"></i> Disponibilidad
                    </button>
                    <button class="btn btn-primary btn-small" id="btn-add-speaker" style="margin: 0">
                        <i data-lucide="plus"></i> Nuevo
                    </button>
                </div>
            </div>

            <div class="speaker-list">
                <!-- List will be rendered here -->
            </div>
        `;

        this.initEvents(container);
        this.renderList(container.querySelector('.speaker-list'), State.authorized);
        return container;
    },

    initEvents(container) {
        container.querySelector('#btn-add-speaker').addEventListener('click', () => this.showModal());

        container.querySelector('#speaker-search').addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = State.authorized.filter(s => s.name.toLowerCase().includes(query));
            this.renderList(container.querySelector('.speaker-list'), filtered);
        });

        const selectAll = container.querySelector('#select-all-speakers');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.toggleAll(e.target.checked));
        }

        const importInput = container.querySelector('#authorized-import-csv');
        if (importInput) {
            importInput.addEventListener('change', (e) => this.handleImportCSV(e));
        }

        container.querySelector('#btn-share-catalog').addEventListener('click', () => {
            const today = new Date();
            const currentMonth = today.toISOString().substring(0, 7);
            const month = prompt('¿Deseas filtrar por disponibilidad en un mes?\nIngrese el mes (YYYY-MM) o deje vacío para catálogo completo:', '');

            // If user cancels (null), don't do anything
            if (month === null) return;

            import('../services/NotificationService.js')
                .then(module => {
                    const ns = module.NotificationService || window.NotificationService;
                    ns.shareSpeakerCatalog(State.authorized, month.trim());
                })
                .catch(err => {
                    console.error('Error sharing catalog:', err);
                    window.showToast('Error al abrir WhatsApp', 'danger');
                });
        });

        container.querySelector('#btn-share-availability').addEventListener('click', () => {
            const today = new Date();
            const currentMonth = today.toISOString().substring(0, 7);
            const month = prompt('Ingrese el mes a consultar (YYYY-MM):', currentMonth);
            if (!month) return;

            import('../services/NotificationService.js')
                .then(module => {
                    const ns = module.NotificationService || window.NotificationService;
                    ns.shareSpeakerAvailability(month);
                })
                .catch(err => {
                    console.error('Error sharing availability:', err);
                    window.showToast('Error al abrir WhatsApp', 'danger');
                });
        });

        if (window.lucide) window.lucide.createIcons();
    },

    renderList(target, list) {
        if (list.length === 0) {
            target.innerHTML = '<p class="empty-state">No hay discursantes registrados.</p>';
            return;
        }

        target.innerHTML = list.map(s => this.renderSpeakerCard(s)).join('');
        if (window.lucide) window.lucide.createIcons();
        this.updateSelectionBar();
    },

    renderSpeakerCard(s) {
        const isSelected = this.selectedIds.has(s.id);
        const talkCount = s.talks?.length || 0;
        return `
            <div class="card speaker-card ${isSelected ? 'selected' : ''}" data-id="${s.id}">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${s.id}" onchange="Authorized.toggleSelection('${s.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="speaker-info" onclick="Authorized.showModal('${s.id}')">
                    <div class="speaker-card-main">
                        <strong>${s.name}</strong>
                        <p class="phone-link"><i data-lucide="phone"></i> ${s.phone || 'Sin teléfono'}</p>
                    </div>
                    <div class="talk-badges-container">
                        ${s.talks.slice(0, 3).map(t => `<span class="badge talk-badge">#${t.outline}</span>`).join('')}
                        ${talkCount > 3 ? `<span class="badge more-badge">+${talkCount - 3}</span>` : ''}
                    </div>
                    <p class="last-ref">Temas: ${s.talks.map(t => t.title).join(', ').substring(0, 50)}${s.talks.length > 0 ? '...' : 'Sin temas'}</p>
                </div>
                <div class="speaker-actions">
                    <button class="btn-icon" onclick="Authorized.showModal('${s.id}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon share" onclick="Authorized.shareSpeakerInfo('${s.id}')">
                        <i data-lucide="share-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    shareSpeakerInfo(id) {
        const speaker = State.authorized.find(s => s.id === id);
        if (!speaker) return;

        let message = `*Lista de Discursos - ${speaker.name}*\n\n`;
        speaker.talks.forEach(t => {
            message += `• *#${t.outline}* - ${t.title} (Cántico: ${t.song || '---'})\n`;
        });
        message += `\n_Enviado desde Programación Discursantes_`;

        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    },

    toggleSelection(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateSelectionBar();
        // Toggle class on card
        const card = document.querySelector(`.speaker-card[data-id="${id}"]`);
        if (card) card.classList.toggle('selected');
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

        // Update Select All checkbox state
        const selectAll = document.getElementById('select-all-speakers');
        if (selectAll) selectAll.checked = this.selectedIds.size === State.authorized.length && State.authorized.length > 0;
    },

    toggleAll(checked) {
        if (checked) {
            State.authorized.forEach(s => this.selectedIds.add(s.id));
        } else {
            this.selectedIds.clear();
        }
        this.renderList(document.querySelector('.speaker-list'), State.authorized);
    },

    handleBulkDelete() {
        if (!confirm(`¿Estás seguro de que deseas eliminar los ${this.selectedIds.size} discursantes seleccionados?`)) return;

        const idsToDelete = Array.from(this.selectedIds);
        this.executeDelete(idsToDelete);
        this.selectedIds.clear();
    },

    handleSingleDelete(id) {
        if (!confirm('¿Eliminar este discursante?')) return;
        this.executeDelete([id]);
    },

    executeDelete(ids) {
        const backup = State.authorized.filter(s => ids.includes(s.id));
        State.authorized = State.authorized.filter(s => !ids.includes(s.id));
        State.saveToStorage('speaker_app_authorized', State.authorized);

        this.renderList(document.querySelector('.speaker-list'), State.authorized);

        window.showUndo('Eliminado', () => {
            State.authorized.push(...backup);
            State.saveToStorage('speaker_app_authorized', State.authorized);
            this.renderList(document.querySelector('.speaker-list'), State.authorized);
        });
    },

    showModal(id = null) {
        let speaker = id ? State.authorized.find(s => s.id === id) : { name: '', phone: '', talks: [], contact_secondary: '', comments: '' };

        if (!id) {
            const draft = localStorage.getItem('draft_speaker');
            if (draft) {
                try { speaker = { ...speaker, ...JSON.parse(draft) }; } catch (e) { }
            }
        }
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>${id ? 'Editar' : 'Nuevo'} Discursante</h3>
                    ${id ? `<button class="btn btn-secondary btn-small" onclick="Authorized.shareSpeakerInfo('${id}')"><i data-lucide="share-2"></i> Compartir Temas</button>` : ''}
                </div>
                <form id="speaker-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" id="speaker-name" value="${speaker.name}" required>
                        </div>
                        <div class="form-group">
                            <label>Teléfono (WhatsApp)</label>
                            <input type="tel" id="speaker-phone" value="${speaker.phone}" required placeholder="521...">
                        </div>
                    </div>
                    
                    ${id ? `
                    <div class="upcoming-speeches-section" style="margin-top: 1rem; margin-bottom: 1rem;">
                        <label style="display: flex; align-items: center; gap: 5px; color: #6366f1; font-weight: 600;">
                            <i data-lucide="calendar"></i> Próximas Salidas (Programadas)
                        </label>
                        <div style="background: rgba(99, 102, 241, 0.05); border-radius: 8px; padding: 10px; margin-top: 5px; border: 1px solid rgba(99, 102, 241, 0.1);">
                            ${(() => {
                    const upcoming = State.outgoing
                        .filter(e => e.speaker_id === id && new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
                        .sort((a, b) => new Date(a.date) - new Date(b.date));

                    if (upcoming.length === 0) return '<p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">Sin salidas próximas programadas.</p>';

                    return upcoming.map(u => `
                                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 5px; padding-bottom: 5px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                        <strong>${u.date}</strong>
                                        <span style="color: #94a3b8;">${u.destination_congregation}</span>
                                    </div>
                                `).join('');
                })()}
                        </div>
                    </div>
                    ` : ''}
                    <div class="form-group">
                        <label>Contacto Secundario (Email/Referencia)</label>
                        <input type="text" id="speaker-secondary" value="${speaker.contact_secondary || ''}" placeholder="Opcional">
                    </div>
                    
                    <div class="talks-section-header">
                        <label><i data-lucide="book-open"></i> Discursos Disponibles</label>
                    </div>
                    <div id="talks-list" class="talks-scroll-area">
                        ${speaker.talks.map((t, i) => this.renderTalkField(t, i)).join('')}
                    </div>
                    <button type="button" class="btn btn-outline btn-small" id="btn-add-talk" style="width:100%; margin-top:0.5rem">
                        <i data-lucide="plus"></i> Añadir Discurso
                    </button>

                    <div class="form-group" style="margin-top:1rem">
                        <label>Notas Privadas</label>
                        <textarea id="speaker-comments" placeholder="Preferencias, fechas bloqueadas, etc.">${speaker.comments || ''}</textarea>
                    </div>

                    <div class="form-actions" style="margin-top: 1.5rem">
                        <div style="display:flex; gap:10px">
                            <button type="button" class="btn btn-secondary" onclick="Authorized.closeModal()">Cancelar</button>
                            <button type="button" class="btn btn-secondary" onclick="Authorized.clearForm()" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Limpiar</button>
                            ${id ? `<button type="button" class="btn btn-icon error" onclick="Authorized.handleSingleDelete('${id}'); Authorized.closeModal()"><i data-lucide="trash-2"></i></button>` : ''}
                        </div>
                        <button type="submit" class="btn btn-primary">Guardar Discursante</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        const form = modal.querySelector('#speaker-form');

        modal.querySelector('#btn-add-talk').addEventListener('click', () => {
            const list = modal.querySelector('#talks-list');
            const newIndex = list.children.length;
            const div = document.createElement('div');
            div.innerHTML = this.renderTalkField({ outline: '', title: '', song: '' }, newIndex);
            list.appendChild(div.firstElementChild);
            if (window.lucide) window.lucide.createIcons();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
            if (!id) localStorage.removeItem('draft_speaker');
        });

        // Draft logic
        const saveDraft = () => {
            if (id) return;
            const draft = {
                name: document.getElementById('speaker-name').value,
                phone: document.getElementById('speaker-phone').value,
                contact_secondary: document.getElementById('speaker-secondary').value,
                comments: document.getElementById('speaker-comments').value,
                talks: [] // Complex nested properties like talks bypassed for draft simplicity
            };
            localStorage.setItem('draft_speaker', JSON.stringify(draft));
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                saveDraft();
                this.closeModal();
            }
        };

        form.addEventListener('input', saveDraft);
    },

    clearForm() {
        if (confirm('¿Estás seguro de limpiar todo el formulario?')) {
            document.getElementById('speaker-form').reset();
            localStorage.removeItem('draft_speaker');
        }
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
        window.onclick = null;
    },

    renderTalkField(talk, index) {
        return `
            <div class="talk-entry card" data-index="${index}" style="padding:0.75rem; margin-bottom:0.5rem">
                <div style="display:flex; gap:10px; margin-bottom:5px">
                    <input type="text" placeholder="Bosquejo" class="talk-outline" value="${talk.outline}" style="width: 30%">
                    <input type="text" placeholder="Título" class="talk-title" value="${talk.title}" style="flex: 1">
                </div>
                <div style="display:flex; gap:10px; align-items:center">
                    <input type="text" placeholder="Cántico" class="talk-song" value="${talk.song}" style="flex: 1">
                    <button type="button" class="btn-icon error" onclick="this.closest('.talk-entry').remove()">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    handleSave(id) {
        const name = document.getElementById('speaker-name').value;
        const phone = PhoneUtils.validate(document.getElementById('speaker-phone').value);
        const secondary = document.getElementById('speaker-secondary').value;

        const comments = document.getElementById('speaker-comments').value;
        const talkEntries = document.querySelectorAll('.talk-entry');

        const talks = Array.from(talkEntries).map(entry => ({
            outline: entry.querySelector('.talk-outline').value,
            title: entry.querySelector('.talk-title').value,
            song: entry.querySelector('.talk-song').value
        }));

        const newSpeaker = {
            id: id || crypto.randomUUID(),
            name,
            phone,
            contact_secondary: secondary,
            comments: comments,
            talks
        };

        if (id) {
            State.updateAuthorizedSpeaker(newSpeaker);
        } else {
            State.addAuthorizedSpeaker(newSpeaker);
        }

        document.getElementById('modal-container').classList.add('hidden');
        this.renderList(document.querySelector('.speaker-list'), State.authorized);
        window.showToast('Guardado correctamente', 'success');
    },

    async handleImportCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const rows = CSVUtils.parseAuto(text);
                if (rows.length < 2) throw new Error("Archivo vacío o formato inválido");

                const pendingRows = [];
                let isFirstRow = true;

                for (const row of rows) {
                    if (isFirstRow && row[0].toLowerCase().includes('nombre') && row[1].toLowerCase().includes('tel')) {
                        isFirstRow = false;
                        continue;
                    }
                    if (row.length < 4) continue;

                    const name = row[0].trim();
                    const phone = PhoneUtils.validate(row[1] ? row[1].trim() : '');
                    const outline = row[2] ? row[2].trim() : '';
                    const title = row[3] ? row[3].trim() : '';
                    const song = row[4] ? row[4].trim() : '';

                    if (!name) continue;

                    pendingRows.push({ name, phone, outline, title, song });
                }

                if (pendingRows.length === 0) {
                    window.showToast('No se encontraron datos válidos', 'warning');
                    return;
                }

                // Identify duplicates: same speaker name AND same talk outline
                const duplicates = [];
                const trulyNew = [];

                pendingRows.forEach(row => {
                    const speaker = State.authorized.find(s => s.name.toLowerCase() === row.name.toLowerCase());
                    const exists = speaker && speaker.talks.some(t => t.outline == row.outline && t.title == row.title);

                    if (exists) duplicates.push(row);
                    else trulyNew.push(row);
                });

                let toAdd = [...trulyNew];
                if (duplicates.length > 0) {
                    const choice = await window.showChoiceModal({
                        title: '⚠️ Discursos Duplicados Detectados',
                        message: `Se encontraron ${duplicates.length} discursos que ya están registrados para estos hermanos. ¿Qué deseas hacer?`,
                        options: [
                            { label: 'Omitir duplicados e importar solo nuevos', value: 'skip', class: 'btn-primary' },
                            { label: 'Reemplazar los existentes (actualizar)', value: 'replace', class: 'btn-secondary' },
                            { label: 'Crear copias (permitir duplicados)', value: 'copies', class: 'btn-secondary' }
                        ]
                    });

                    if (choice === 'cancel') return;
                    if (choice === 'copies') toAdd = [...trulyNew, ...duplicates];
                    if (choice === 'replace') {
                        // For 'replace' in Authorized, we just merge naturally but don't skip
                        toAdd = [...trulyNew, ...duplicates];
                        // We will deduplicate during insertion by outline
                    }
                }

                // Process the toAdd list
                toAdd.forEach(row => {
                    let speaker = State.authorized.find(s => s.name.toLowerCase() === row.name.toLowerCase());
                    if (!speaker) {
                        speaker = {
                            id: crypto.randomUUID(),
                            name: row.name,
                            phone: row.phone,
                            contact_secondary: '',
                            comments: '',
                            talks: []
                        };
                        State.authorized.push(speaker);
                    } else if (row.phone && !speaker.phone) {
                        speaker.phone = row.phone; // Update phone if missing
                    }

                    // Check if outline exists to avoid internal duplicates within the same import unless 'copies'
                    const talkExists = speaker.talks.find(t => t.outline == row.outline);
                    if (!talkExists || (choice === 'copies')) {
                        speaker.talks.push({ outline: row.outline, title: row.title, song: row.song });
                    }
                });

                State.saveToStorage('speaker_app_authorized', State.authorized);
                this.renderList(document.querySelector('.speaker-list'), State.authorized);
                window.showToast(`Importación finalizada exitosamente`, 'success');

            } catch (error) {
                console.error("Error importing CSV:", error);
                window.showToast('Error al importar el archivo CSV', 'danger');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }
};

window.Authorized = Authorized;
