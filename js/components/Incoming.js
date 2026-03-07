import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';
import { EventService } from '../services/EventService.js';
import { CSVUtils } from '../utils/csv.js';

export const Incoming = {

    selectedIds: new Set(),
    filters: {
        query: '',
        congregation: '',
        year: '',
        month: '',
        sort: 'desc'
    },

    render(params) {
        // Reset or set filters based on params
        if (params && params.get('filter') === 'recent') {
            const sixtyDaysAgo = new Date();
            sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
            this.filters.minDate = sixtyDaysAgo.toISOString().split('T')[0];
        } else {
            delete this.filters.minDate;
        }

        const container = document.createElement('div');
        container.className = 'events-view';

        container.innerHTML = `
            <div id="selection-bar" class="selection-bar hidden">
                <span id="selection-count">0 seleccionados</span>
                <button class="btn btn-danger btn-small" onclick="Incoming.handleBulkDelete()">
                    <i data-lucide="trash-2"></i> Borrar
                </button>
            </div>
            <div class="view-header" style="flex-wrap: wrap; gap: 0.5rem">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="select-all-incoming" title="Seleccionar todos">
                    <h2>Discursantes que Vienen</h2>
                </div>
                <div style="display: flex; gap: 0.5rem; flex: 1; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    <label class="btn btn-secondary btn-small" style="cursor: pointer; margin: 0">
                        <i data-lucide="upload"></i> Importar CSV
                        <input type="file" id="incoming-import-csv" accept=".csv, .txt" class="hidden">
                    </label>
                    <button class="btn btn-primary btn-small" id="btn-add-event" style="margin: 0">
                        <i data-lucide="plus"></i> Agendar Visita
                    </button>
                </div>
            </div>

            <div class="filter-bar card" style="display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.75rem; margin-bottom: 1rem;">
                <input type="text" id="filter-query" placeholder="Buscar por discurso o título..." style="flex: 2; min-width: 200px;" value="${this.filters.query}">
                <input type="text" id="filter-cong" placeholder="Congregación..." style="flex: 1; min-width: 150px;" value="${this.filters.congregation}">
                <select id="filter-month" style="flex: 0.8; min-width: 100px;">
                    <option value="">Mes...</option>
                    ${['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => `<option value="${(i + 1).toString().padStart(2, '0')}" ${this.filters.month === (i + 1).toString().padStart(2, '0') ? 'selected' : ''}>${m}</option>`).join('')}
                </select>
                <select id="filter-year" style="flex: 0.8; min-width: 80px;">
                    <option value="">Año...</option>
                    ${[2024, 2025, 2026, 2027].map(y => `<option value="${y}" ${this.filters.year == y ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
                <select id="filter-sort" style="flex: 0.8; min-width: 120px;">
                    <option value="desc" ${this.filters.sort === 'desc' ? 'selected' : ''}>Nuevo a Viejo</option>
                    <option value="asc" ${this.filters.sort === 'asc' ? 'selected' : ''}>Viejo a Nuevo</option>
                </select>
                <button class="btn btn-secondary btn-small" id="btn-clear-filters"><i data-lucide="rotate-ccw"></i></button>
            </div>

            <div class="event-list">
                <!-- Content will be injected -->
            </div>
        `;

        this.initEvents(container);
        this.renderList(container.querySelector('.event-list'), State.incoming);
        return container;
    },

    initEvents(container) {
        container.querySelector('#btn-add-event').addEventListener('click', () => this.showModal());
        const importInput = container.querySelector('#incoming-import-csv');
        if (importInput) importInput.addEventListener('change', (e) => this.handleImportCSV(e));

        const selectAll = container.querySelector('#select-all-incoming');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.toggleAll(e.target.checked));
        }

        // Filter events
        const qInput = container.querySelector('#filter-query');
        const cInput = container.querySelector('#filter-cong');
        const mInput = container.querySelector('#filter-month');
        const yInput = container.querySelector('#filter-year');
        const sInput = container.querySelector('#filter-sort');
        const clearBtn = container.querySelector('#btn-clear-filters');

        const updateFilters = () => {
            this.filters.query = qInput.value.toLowerCase();
            this.filters.congregation = cInput.value.toLowerCase();
            this.filters.month = mInput.value;
            this.filters.year = yInput.value;
            this.filters.sort = sInput.value;
            this.renderList(container.querySelector('.event-list'), State.incoming);
        };

        [qInput, cInput, mInput, yInput, sInput].forEach(el => el.addEventListener('input', updateFilters));
        clearBtn.addEventListener('click', () => {
            qInput.value = ''; cInput.value = ''; mInput.value = ''; yInput.value = ''; sInput.value = 'desc';
            updateFilters();
        });

        if (window.lucide) window.lucide.createIcons();
    },

    formatDisplayDate(isoDate) {
        if (!isoDate) return '';
        const [y, m, d] = isoDate.split('-');
        return `${d}-${m}-${y}`;
    },

    renderList(target, list) {
        let filtered = [...list].filter(e => {
            const matchesQuery = !this.filters.query ||
                e.talk_title.toLowerCase().includes(this.filters.query) ||
                e.outline_number.includes(this.filters.query) ||
                e.speaker_name.toLowerCase().includes(this.filters.query);

            const matchesCong = !this.filters.congregation ||
                e.congregation_origin.toLowerCase().includes(this.filters.congregation);

            const [y, m, d] = e.date.split('-');
            const matchesMonth = !this.filters.month || m === this.filters.month;
            const matchesYear = !this.filters.year || y === this.filters.year;

            const matchesMinDate = !this.filters.minDate || e.date >= this.filters.minDate;

            return matchesQuery && matchesCong && matchesMonth && matchesYear && matchesMinDate;
        });

        if (filtered.length === 0) {
            target.innerHTML = '<p class="empty-state">No se encontraron resultados con los filtros actuales.</p>';
            return;
        }

        filtered.sort((a, b) => {
            const da = new Date(a.date);
            const db = new Date(b.date);
            return this.filters.sort === 'desc' ? db - da : da - db;
        });

        target.innerHTML = filtered.map(e => this.renderEventCard(e)).join('');
        if (window.lucide) window.lucide.createIcons();
        this.updateSelectionBar();
    },

    renderEventCard(e) {
        const isSelected = this.selectedIds.has(e.id);
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dateObj = new Date(e.date + 'T12:00:00');
        const dayName = dayNames[dateObj.getDay()];

        return `
            <div class="card event-card ${isSelected ? 'selected' : ''}" data-id="${e.id}" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem;">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${e.id}" onchange="Incoming.toggleSelection('${e.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="event-info" onclick="Incoming.showModal('${e.id}')" style="display: flex; gap: 1.5rem; flex: 1; align-items: center;">
                    <div class="event-date-badge" style="width: auto; min-width: 140px; padding: 0.5rem 1rem; flex-direction: column; align-items: flex-start; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid var(--glass-border);">
                        <span class="day" style="font-size: 0.8rem; text-transform: uppercase; color: var(--primary); font-weight: 800;">${dayName}</span>
                        <span class="date" style="font-size: 1.1rem; font-weight: 700; color: white;">${this.formatDisplayDate(e.date)}</span>
                    </div>
                    <div class="event-details" style="flex: 1;">
                        <strong style="font-size: 1.2rem; display: block; margin-bottom: 0.25rem;">${e.speaker_name}</strong>
                        <p class="origin" style="display: flex; align-items: center; gap: 5px; color: var(--text-dim); margin-bottom: 0.25rem;">
                            <i data-lucide="map-pin" style="width: 14px;"></i> ${e.congregation_origin}
                        </p>
                        <span class="talk-info" style="color: var(--accent); font-weight: 600;">#${e.outline_number} ${e.talk_title}</span>
                    </div>
                </div>
                <div class="event-actions" style="display: flex; gap: 0.75rem;">
                    <div class="notification-group" style="display: flex; gap: 0.4rem; background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: 12px;">
                         <button class="btn btn-secondary btn-small" title="Notificar Discursante" onclick="event.stopPropagation(); Incoming.shareWhatsApp('${e.id}', 'speaker')" style="width: 42px; height: 42px; padding: 0;">
                            <i data-lucide="user"></i>
                        </button>
                        <button class="btn btn-secondary btn-small" title="Notificar Coordinador Origen" onclick="event.stopPropagation(); Incoming.shareWhatsApp('${e.id}', 'coordinator')" style="width: 42px; height: 42px; padding: 0;">
                            <i data-lucide="map-pin"></i>
                        </button>
                    </div>
                    <button class="btn-icon" onclick="event.stopPropagation(); Incoming.showModal('${e.id}')" style="width: 42px; height: 42px;">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon error" onclick="event.stopPropagation(); Incoming.handleSingleDelete('${e.id}')" style="width: 42px; height: 42px;">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    },

    toggleSelection(id) {
        if (this.selectedIds.has(id)) {
            this.selectedIds.delete(id);
        } else {
            this.selectedIds.add(id);
        }
        this.updateSelectionBar();
        const card = document.querySelector(`.event-card[data-id="${id}"]`);
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
        const selectAll = document.getElementById('select-all-incoming');
        if (selectAll) selectAll.checked = this.selectedIds.size === State.incoming.length && State.incoming.length > 0;
    },

    toggleAll(checked) {
        if (checked) {
            State.incoming.forEach(e => this.selectedIds.add(e.id));
        } else {
            this.selectedIds.clear();
        }
        this.renderList(document.querySelector('.event-list'), State.incoming);
    },

    handleBulkDelete() {
        if (!confirm(`¿Estás seguro de que deseas eliminar las ${this.selectedIds.size} visitas seleccionadas?`)) return;
        const idsToDelete = Array.from(this.selectedIds);
        this.executeDelete(idsToDelete);
        this.selectedIds.clear();
    },

    handleSingleDelete(id) {
        if (!confirm('¿Eliminar esta visita?')) return;
        this.executeDelete([id]);
    },

    executeDelete(ids) {
        EventService.deleteEvents('incoming', ids, () => {
            if (document.querySelector('.event-list')) {
                this.renderList(document.querySelector('.event-list'), State.incoming);
            }
        });
        this.renderList(document.querySelector('.event-list'), State.incoming);
    },

    showModal(id = null) {
        let event = id ? State.incoming.find(e => e.id === id) : {
            speaker_name: '', speaker_phone: '', congregation_origin: '', outline_number: '', talk_title: '', song_number: '', date: '', time: '12:00', contact_secondary: '', comments: ''
        };

        if (!id) {
            const draft = localStorage.getItem('draft_incoming');
            if (draft) {
                try { event = { ...event, ...JSON.parse(draft) }; } catch (e) { }
            }
        }

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        // Find congregation info to show contacts if available
        const originCong = State.origins.find(o => o.name === event.congregation_origin);

        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>${id ? 'Editar' : 'Programar'} Visita</h3>
                    ${id ? `
                    <div style="display:flex; gap:5px; align-items:center;">
                        <span style="font-size:0.75rem; color:#94a3b8; margin-right:5px">Notificar:</span>
                        <button type="button" class="btn btn-secondary btn-small" title="Al Discursante" onclick="Incoming.shareWhatsApp('${id}', 'speaker')"><i data-lucide="user"></i></button>
                        <button type="button" class="btn btn-secondary btn-small" title="A Coord. Origen" onclick="Incoming.shareWhatsApp('${id}', 'coordinator')"><i data-lucide="map-pin"></i></button>
                        <button type="button" class="btn btn-secondary btn-small" title="A Coord. Local" onclick="Incoming.shareWhatsApp('${id}', 'local_coordinator')"><i data-lucide="home"></i></button>
                    </div>
                    ` : ''}
                </div>
                <form id="event-form">
                    <div class="form-section-title">Datos del Discursante</div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre (Visitante)</label>
                            <input type="text" id="e-name" value="${event.speaker_name}" required>
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input type="tel" id="e-phone" value="${event.speaker_phone}" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Congregación de Origen</label>
                        <input type="text" id="e-origin" list="origin-list" value="${event.congregation_origin}" required placeholder="Buscar o escribir (Ej. Central)">
                        <datalist id="origin-list">
                            ${[...State.destinations, ...State.origins]
                .reduce((acc, curr) => {
                    if (!acc.find(item => item.name === curr.name)) acc.push(curr);
                    return acc;
                }, [])
                .map(o => `<option value="${o.name}">`).join('')}
                        </datalist>
                        <p class="hint-text" id="origin-hint">
                            ${originCong ? (
                [originCong.address ? `📍 ${originCong.address}` : '',
                originCong.meeting_day ? `📅 ${originCong.meeting_day}` : ''
                ].filter(Boolean).join(' | ') +
                (originCong.address || originCong.meeting_day ? '<br>' : '') +
                `Contacto: ${originCong.contact_name} (${originCong.contact_phone})`
            ) : ''}
                        </p>
                    </div>

                    <div class="form-section-title">Detalles del Discurso</div>
                    <div class="form-row">
                        <div class="form-group" style="flex: 0 0 30%">
                            <label>Bosquejo #</label>
                            <input type="text" id="e-outline" value="${event.outline_number}" required>
                        </div>
                        <div class="form-group" style="flex: 1">
                            <label>Título</label>
                            <input type="text" id="e-title" value="${event.talk_title}" required>
                        </div>
                        <div class="form-group" style="flex: 0 0 20%">
                            <label>Cántico</label>
                            <input type="text" id="e-song" value="${event.song_number || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Fecha</label>
                            <input type="date" id="e-date" value="${event.date}" required>
                        </div>
                        <div class="form-group">
                            <label>Hora</label>
                            <input type="time" id="e-time" value="${event.time}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Notas adicionales</label>
                        <textarea id="e-comments" placeholder="Ej: Necesita transporte, dieta especial, etc.">${event.comments || ''}</textarea>
                    </div>

                    <div class="form-actions" style="margin-top: 1.5rem">
                        <button type="button" class="btn btn-secondary" onclick="Incoming.closeModal()">Cancelar</button>
                        <button type="button" class="btn btn-secondary" onclick="Incoming.clearForm()" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Limpiar</button>
                        <button type="submit" class="btn btn-primary">${id ? 'Actualizar' : 'Agendar Visita'}</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        const form = document.getElementById('event-form');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
            if (!id) localStorage.removeItem('draft_incoming');
        });

        // Autofill logic
        const originInput = modal.querySelector('#e-origin');
        if (originInput) {
            originInput.addEventListener('input', (e) => {
                const combined = [...State.destinations, ...State.origins];
                const selectedCong = combined.find(o => o.name === e.target.value);
                if (selectedCong) {
                    if (selectedCong.meeting_time) {
                        modal.querySelector('#e-time').value = selectedCong.meeting_time;
                    }
                    if (selectedCong.address) {
                        // Store address and day in the event object indirectly or show in hint
                        // The user wants these to be "filled", so we should ideally have fields for them 
                        // even if they are just for notification purposes.
                    }
                    const hintEl = modal.querySelector('#origin-hint');
                    if (hintEl) {
                        let hint = [];
                        if (selectedCong.address) hint.push(`📍 ${selectedCong.address}`);
                        if (selectedCong.meeting_day) hint.push(`📅 ${selectedCong.meeting_day}`);
                        const hintText = hint.length > 0 ? hint.join(' | ') + '<br>' : '';
                        hintEl.innerHTML = hintText + `Contacto: ${selectedCong.contact_name} (${selectedCong.contact_phone})`;
                    }
                }
            });
        }

        // Duplicate warning logic
        const checkDuplicate = () => {
            const outline = document.getElementById('e-outline').value.trim();
            const dateVal = document.getElementById('e-date').value;
            if (!outline || !dateVal) return;

            const current = new Date(dateVal + 'T12:00:00');
            const threeMonthsAgo = new Date(current);
            threeMonthsAgo.setMonth(current.getMonth() - 3);

            const duplicates = State.incoming.filter(e => {
                if (e.id === id) return false; // skip self
                if (e.outline_number !== outline) return false;
                const eDate = new Date(e.date + 'T12:00:00');
                return eDate >= threeMonthsAgo && eDate <= current;
            });

            if (duplicates.length > 0) {
                window.showToast(`⚠️ Aviso: El bosquejo #${outline} ya se programó localmente en los últimos 3 meses (${duplicates[0].date}).`, 'warning');
            }
        };

        modal.querySelector('#e-outline').addEventListener('blur', checkDuplicate);
        modal.querySelector('#e-date').addEventListener('change', checkDuplicate);

        // Draft logic
        const saveDraft = () => {
            if (id) return;
            const draft = {
                speaker_name: document.getElementById('e-name').value,
                speaker_phone: document.getElementById('e-phone').value,
                congregation_origin: document.getElementById('e-origin').value,
                outline_number: document.getElementById('e-outline').value,
                talk_title: document.getElementById('e-title').value,
                song_number: document.getElementById('e-song').value,
                date: document.getElementById('e-date').value,
                time: document.getElementById('e-time').value,
                comments: document.getElementById('e-comments').value
            };
            localStorage.setItem('draft_incoming', JSON.stringify(draft));
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
            document.getElementById('event-form').reset();
            localStorage.removeItem('draft_incoming');
        }
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
        window.onclick = null;
    },

    shareWhatsApp(id, target) {
        import('../services/NotificationService.js').then(({ NotificationService }) => {
            NotificationService.openWhatsApp('incoming', id, target);
        });
    },

    sharePreview(id) {
        // Disabled since we use direct WhatsApp sharing now, but kept for legacy/compatibility
        const event = State.incoming.find(e => e.id === id);
        if (event) {
            window.router.navigate('reports');
            setTimeout(() => {
                document.getElementById('filter-start').value = event.date;
                document.getElementById('filter-end').value = event.date;
                document.getElementById('filter-type').value = 'Viene';
                document.getElementById('btn-filter').click();
                window.showToast('Previsualización lista para compartir', 'info');
            }, 500);
        }
    },

    handleSave(id) {
        const data = {
            id: id || crypto.randomUUID(),
            speaker_name: document.getElementById('e-name').value,
            speaker_phone: PhoneUtils.validate(document.getElementById('e-phone').value),
            congregation_origin: document.getElementById('e-origin').value,
            outline_number: document.getElementById('e-outline').value,
            talk_title: document.getElementById('e-title').value,
            song_number: document.getElementById('e-song').value,
            date: document.getElementById('e-date').value,
            time: document.getElementById('e-time').value,
            comments: document.getElementById('e-comments').value
        };

        const result = EventService.saveIncoming(data);

        if (result.success) {
            document.getElementById('modal-container').classList.add('hidden');
            this.renderList(document.querySelector('.event-list'), State.incoming);
            window.showToast('Visita guardada', 'success');
        } else if (result.message) {
            window.showToast(result.message, 'warning');
        }
    },

    parseSpanishDate(dateStr) {
        if (!dateStr) return '';
        // "domingo, 12 de julio de 2026" or "12/07/2026"
        const months = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12' };
        const str = dateStr.toLowerCase();
        for (const [monthName, monthNum] of Object.entries(months)) {
            if (str.includes(monthName)) {
                const match = str.match(/(\d{1,2})\s+de\s+[a-z]+\s+de\s+(\d{4})/);
                if (match) {
                    const d = match[1].padStart(2, '0');
                    return `${match[2]}-${monthNum}-${d}`;
                }
            }
        }
        // Try parsing normal date if not spanish format
        const d = new Date(dateStr);
        if (!isNaN(d)) return d.toISOString().split('T')[0];
        return '';
    },

    parseTime(timeStr) {
        if (!timeStr) return '12:00';
        let match = timeStr.match(/(\d{1,2}):(\d{2})([^a-z]*)([ap]\.?\s?m\.?)/i);
        if (match) {
            let h = parseInt(match[1]);
            const m = match[2];
            const ampm = match[4].toLowerCase().replace(/\./g, '').trim();
            if (ampm === 'pm' && h < 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            if (amppm === 'am' && h === 12) h = 0;
            return `${h.toString().padStart(2, '0')}:${m}`;
        }
        return '12:00';
    },

    async handleImportCSV(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target.result;
                const rows = CSVUtils.parseAuto(text);
                if (rows.length < 2) throw new Error("Archivo vacío");

                const pendingData = [];
                let isFirstRow = true;

                for (const row of rows) {
                    // Cols: Congregación | No. Telefónico | Nombre discursante | Canción | Título | Fecha | Horario | Comentarios
                    if (isFirstRow && row[0].toLowerCase().includes('congregaci')) { isFirstRow = false; continue; }
                    if (row.length < 5) continue;

                    const congregation = row[0].trim();
                    const phone = PhoneUtils.validate(row[1] ? row[1].trim() : '');
                    const speakerName = row[2].trim();
                    const song = row[3] ? row[3].trim() : '';
                    let outline = '';
                    let title = '';

                    // In the image, Título format seems to have the outline sometimes or just Title.
                    // But wait, the image for Incoming (3rd image) has "Título" column which contains "189 Andar con Dios..."
                    // So we must extract outline from title column (row 4)
                    const titleRaw = row[4] ? row[4].trim() : '';
                    const rawDate = row[5] || '';
                    const rawTime = row[6] || '';
                    const comments = row[7] || '';

                    if (!speakerName || !titleRaw || !rawDate) continue;

                    // Extract outline from title (e.g., "189 Andar con Dios...")
                    const numMatch = titleRaw.match(/^(\d+)[-\s]+(.*)/);
                    if (numMatch) {
                        outline = numMatch[1];
                        title = numMatch[2].trim();
                    } else {
                        title = titleRaw;
                    }

                    const formattedDate = this.parseSpanishDate(rawDate);
                    if (!formattedDate) continue; // Skip if date is invalid

                    const formattedTime = this.parseTime(rawTime);

                    pendingData.push({
                        speaker_name: speakerName,
                        speaker_phone: phone,
                        congregation_origin: congregation,
                        outline_number: outline,
                        talk_title: title,
                        song_number: song,
                        date: formattedDate,
                        time: formattedTime,
                        comments: comments
                    });
                }

                if (pendingData.length === 0) {
                    window.showToast('No se encontraron datos válidos', 'warning');
                    return;
                }

                // Split into new and duplicates
                const duplicates = [];
                const trulyNew = [];

                pendingData.forEach(p => {
                    const isDuplicate = State.incoming.some(item => {
                        return item.speaker_name === p.speaker_name &&
                            item.speaker_phone === p.speaker_phone &&
                            item.congregation_origin === p.congregation_origin &&
                            item.outline_number === p.outline_number &&
                            item.talk_title === p.talk_title &&
                            item.song_number === p.song_number &&
                            item.date === p.date &&
                            item.time === p.time &&
                            item.comments === p.comments;
                    });
                    if (isDuplicate) duplicates.push(p);
                    else trulyNew.push(p);
                });

                let toAdd = [...trulyNew];
                if (duplicates.length > 0) {
                    const choice = await window.showChoiceModal({
                        title: '⚠️ Registros Duplicados Detectados',
                        message: `Se encontraron ${duplicates.length} discursos que ya existen exactamente igual en el sistema. ¿Qué deseas hacer?`,
                        options: [
                            { label: 'Omitir duplicados e importar solo nuevos', value: 'skip', class: 'btn-primary' },
                            { label: 'Reemplazar los existentes con estos nuevos', value: 'replace', class: 'btn-secondary' },
                            { label: 'Crear copias duplicadas de todos', value: 'copies', class: 'btn-secondary' }
                        ]
                    });

                    if (choice === 'cancel') return;
                    if (choice === 'copies') toAdd = [...trulyNew, ...duplicates];
                    if (choice === 'replace') {
                        // Delete matching ones from State
                        duplicates.forEach(d => {
                            State.incoming = State.incoming.filter(item => {
                                return !(item.speaker_name === d.speaker_name &&
                                    item.speaker_phone === d.speaker_phone &&
                                    item.congregation_origin === d.congregation_origin &&
                                    item.outline_number === d.outline_number &&
                                    item.talk_title === d.talk_title &&
                                    item.song_number === d.song_number &&
                                    item.date === d.date &&
                                    item.time === d.time &&
                                    item.comments === d.comments);
                            });
                        });
                        toAdd = [...trulyNew, ...duplicates];
                    }
                }

                // Process the final list
                toAdd.forEach(data => {
                    // Auto-detect and add new foreign congregation (Origin)
                    if (data.congregation_origin) {
                        const exists = State.origins.find(o => o.name.toLowerCase() === data.congregation_origin.toLowerCase());
                        if (!exists) {
                            State.origins.push({
                                id: crypto.randomUUID(),
                                name: data.congregation_origin,
                                contact_name: 'Coordinador',
                                contact_phone: data.speaker_phone, // Use speaker phone as a starting point if no other info
                                address: '',
                                meeting_day: '',
                                meeting_time: data.time
                            });
                            State.saveToStorage('speaker_app_origins', State.origins);
                        }
                    }

                    State.incoming.push({ ...data, id: crypto.randomUUID() });
                });

                State.saveToStorage('speaker_app_incoming', State.incoming);
                this.renderList(document.querySelector('.event-list'), State.incoming);
                window.showToast(`Importación finalizada: ${toAdd.length} registros procesados`, 'success');

            } catch (error) {
                console.error("Error importing CSV:", error);
                window.showToast(error.message, 'danger');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }
};

window.Incoming = Incoming;
