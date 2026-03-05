import { State } from '../context/state.js';
import { EventService } from '../services/EventService.js';
import { CSVUtils } from '../utils/csv.js';
import { PhoneUtils } from '../utils/phone.js';

export const Outgoing = {
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
                <button class="btn btn-danger btn-small" onclick="Outgoing.handleBulkDelete()">
                    <i data-lucide="trash-2"></i> Borrar
                </button>
            </div>
            <div class="view-header" style="flex-wrap: wrap; gap: 0.5rem">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <input type="checkbox" id="select-all-outgoing" title="Seleccionar todos">
                    <h2>Discursantes que Van (Salidas)</h2>
                </div>
                <div style="display: flex; gap: 0.5rem; flex: 1; align-items: center; justify-content: flex-end; flex-wrap: wrap;">
                    <label class="btn btn-secondary btn-small" style="cursor: pointer; margin: 0">
                        <i data-lucide="upload"></i> Importar CSV
                        <input type="file" id="outgoing-import-csv" accept=".csv, .txt" class="hidden">
                    </label>
                    <button class="btn btn-primary btn-small" id="btn-add-event" style="margin: 0">
                        <i data-lucide="plus"></i> Agendar Salida
                    </button>
                </div>
            </div>

            <div class="filter-bar card" style="display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 0.75rem; margin-bottom: 1rem;">
                <input type="text" id="filter-query" placeholder="Buscar por discurso o título..." style="flex: 2; min-width: 200px;" value="${this.filters.query}">
                <input type="text" id="filter-cong" placeholder="Congregación Destino..." style="flex: 1; min-width: 150px;" value="${this.filters.congregation}">
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
        this.renderList(container.querySelector('.event-list'), State.outgoing);
        return container;
    },

    initEvents(container) {
        container.querySelector('#btn-add-event').addEventListener('click', () => this.showModal());
        const importInput = container.querySelector('#outgoing-import-csv');
        if (importInput) importInput.addEventListener('change', (e) => this.handleImportCSV(e));

        const selectAll = container.querySelector('#select-all-outgoing');
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
            this.renderList(container.querySelector('.event-list'), State.outgoing);
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
            const speaker = State.authorized.find(s => s.id === e.speaker_id);
            const matchesQuery = !this.filters.query ||
                e.talk_title.toLowerCase().includes(this.filters.query) ||
                e.outline_number.includes(this.filters.query) ||
                (speaker && speaker.name.toLowerCase().includes(this.filters.query));

            const matchesCong = !this.filters.congregation ||
                e.destination_congregation.toLowerCase().includes(this.filters.congregation);

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
        const speaker = State.authorized.find(s => s.id === e.speaker_id);
        const isSelected = this.selectedIds.has(e.id);
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const dateObj = new Date(e.date + 'T12:00:00');
        const dayName = dayNames[dateObj.getDay()];

        return `
            <div class="card event-card ${isSelected ? 'selected' : ''}" data-id="${e.id}" style="display: flex; align-items: center; gap: 1rem; padding: 1.25rem;">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${e.id}" onchange="Outgoing.toggleSelection('${e.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="event-info" onclick="Outgoing.showModal('${e.id}')" style="display: flex; gap: 1.5rem; flex: 1; align-items: center;">
                    <div class="event-date-badge" style="width: auto; min-width: 140px; padding: 0.5rem 1rem; flex-direction: column; align-items: flex-start; background: rgba(255,255,255,0.03); border-radius: 12px; border: 1px solid var(--glass-border);">
                        <span class="day" style="font-size: 0.8rem; text-transform: uppercase; color: var(--primary); font-weight: 800;">${dayName}</span>
                        <span class="date" style="font-size: 1.1rem; font-weight: 700; color: white;">${this.formatDisplayDate(e.date)}</span>
                    </div>
                    <div class="event-details" style="flex: 1;">
                        <strong style="font-size: 1.2rem; display: block; margin-bottom: 0.25rem;">${speaker?.name || 'Desconocido'}</strong>
                        <p class="destination" style="display: flex; align-items: center; gap: 5px; color: var(--text-dim); margin-bottom: 0.25rem;">
                            <i data-lucide="map-pin" style="width: 14px;"></i> ${e.destination_congregation}
                        </p>
                        <span class="talk-info" style="color: var(--secondary); font-weight: 600;">#${e.outline_number} ${e.talk_title}</span>
                    </div>
                </div>
                <div class="event-actions" style="display: flex; gap: 0.75rem;">
                     <div class="notification-group" style="display: flex; gap: 0.4rem; background: rgba(0,0,0,0.2); padding: 0.4rem; border-radius: 12px;">
                        <button class="btn btn-secondary btn-small" title="Notificar Discursante" onclick="event.stopPropagation(); Outgoing.shareWhatsApp('${e.id}', 'speaker')" style="width: 42px; height: 42px; padding: 0;">
                            <i data-lucide="user"></i>
                        </button>
                        <button class="btn btn-secondary btn-small" title="Notificar Coordinador Anfitrión" onclick="event.stopPropagation(); Outgoing.shareWhatsApp('${e.id}', 'coordinator')" style="width: 42px; height: 42px; padding: 0;">
                            <i data-lucide="map-pin"></i>
                        </button>
                    </div>
                    <button class="btn-icon" onclick="event.stopPropagation(); Outgoing.showModal('${e.id}')" style="width: 42px; height: 42px;">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon error" onclick="event.stopPropagation(); Outgoing.handleSingleDelete('${e.id}')" style="width: 42px; height: 42px;">
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
    },

    handleBulkDelete() {
        if (!confirm(`¿Eliminar ${this.selectedIds.size} eventos?`)) return;
        const idsToDelete = Array.from(this.selectedIds);
        this.executeDelete(idsToDelete);
        this.selectedIds.clear();
    },

    handleSingleDelete(id) {
        if (!confirm('¿Eliminar este evento?')) return;
        this.executeDelete([id]);
    },

    executeDelete(ids) {
        EventService.deleteEvents('outgoing', ids, () => {
            if (document.querySelector('.event-list')) {
                this.renderList(document.querySelector('.event-list'), State.outgoing);
            }
        });
        this.renderList(document.querySelector('.event-list'), State.outgoing);
    },

    showModal(id = null) {
        let event = id ? State.outgoing.find(e => e.id === id) : {
            speaker_id: '', outline_number: '', talk_title: '', song_number: '', destination_congregation: '', date: '', time: '10:00', comments: ''
        };

        if (!id) {
            const draft = localStorage.getItem('draft_outgoing');
            if (draft) {
                try { event = { ...event, ...JSON.parse(draft) }; } catch (e) { }
            }
        }

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        const destinations = State.destinations;
        const destCong = State.destinations.find(d => d.name === event.destination_congregation);

        modal.innerHTML = `
            <div class="modal-content card">
                <div class="modal-header">
                    <h3>${id ? 'Editar' : 'Programar'} Salida</h3>
                    ${id ? `
                    <div style="display:flex; gap:5px; align-items:center;">
                        <span style="font-size:0.75rem; color:#94a3b8; margin-right:5px">Notificar:</span>
                        <button type="button" class="btn btn-secondary btn-small" title="Al Discursante" onclick="Outgoing.shareWhatsApp('${id}', 'speaker')"><i data-lucide="user"></i></button>
                        <button type="button" class="btn btn-secondary btn-small" title="A Coord. Anfitrión" onclick="Outgoing.shareWhatsApp('${id}', 'coordinator')"><i data-lucide="map-pin"></i></button>
                        <button type="button" class="btn btn-secondary btn-small" title="A Coord. Local" onclick="Outgoing.shareWhatsApp('${id}', 'local_coordinator')"><i data-lucide="home"></i></button>
                    </div>
                    ` : ''}
                </div>
                <form id="event-form">
                    <div class="form-section-title">Discursante de Mi Congregación</div>
                    <div class="form-group">
                        <label>Seleccionar Hermano</label>
                        <select id="e-speaker" required>
                            <option value="">Seleccionar...</option>
                            ${State.authorized.map(s => `<option value="${s.id}" ${s.id === event.speaker_id ? 'selected' : ''}>${s.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="form-group" style="position: relative;">
                        <label>Congregación Destino</label>
                        <i data-lucide="search" style="position: absolute; left: 10px; top: 38px; width: 18px; color: #94a3b8; pointer-events: none;"></i>
                        <input type="text" id="e-destination" list="dest-list" value="${event.destination_congregation}" required placeholder="Buscar o escribir (Ej. Central)" style="padding-left: 35px;" autocomplete="off">
                        <datalist id="dest-list">
                            ${destinations.map(d => `<option value="${d.name}">`).join('')}
                        </datalist>
                        <p class="hint-text" id="dest-hint">
                            ${destCong ? (
                [destCong.address ? `📍 ${destCong.address}` : '',
                destCong.meeting_day ? `📅 ${destCong.meeting_day}` : ''
                ].filter(Boolean).join(' | ') +
                (destCong.address || destCong.meeting_day ? '<br>' : '') +
                `Contacto: ${destCong.contact_name} (${destCong.contact_phone})`
            ) : ''}
                        </p>
                    </div>

                    <div class="form-section-title">Detalles de la Asignación</div>
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
                        <label>Notas / Comentarios</label>
                        <textarea id="e-comments" placeholder="Notas adicionales">${event.comments || ''}</textarea>
                    </div>

                    <div class="form-actions" style="margin-top: 1.5rem">
                        <button type="button" class="btn btn-secondary" onclick="Outgoing.closeModal()">Cancelar</button>
                        <button type="button" class="btn btn-secondary" onclick="Outgoing.clearForm()" style="background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);">Limpiar</button>
                        <button type="submit" class="btn btn-primary">${id ? 'Actualizar' : 'Agendar Salida'}</button>
                    </div>
                </form>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();

        const form = document.getElementById('event-form');

        // Autofill logic
        const destInput = modal.querySelector('#e-destination');
        if (destInput) {
            destInput.addEventListener('input', (e) => {
                const selectedCong = State.destinations.find(d => d.name === e.target.value);
                if (selectedCong) {
                    if (selectedCong.meeting_time) {
                        modal.querySelector('#e-time').value = selectedCong.meeting_time;
                    }
                    const hintEl = modal.querySelector('#dest-hint');
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

        // Auto-fill title and song from speaker if outline matches
        modal.querySelector('#e-speaker').addEventListener('change', (e) => this.autoFill(e.target.value));
        modal.querySelector('#e-outline').addEventListener('input', (e) => this.autoFill(modal.querySelector('#e-speaker').value, e.target.value));

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
            if (!id) localStorage.removeItem('draft_outgoing');
        });

        // Draft logic
        const saveDraft = () => {
            if (id) return;
            const draft = {
                speaker_id: document.getElementById('e-speaker').value,
                destination_congregation: document.getElementById('e-destination').value,
                outline_number: document.getElementById('e-outline').value,
                talk_title: document.getElementById('e-title').value,
                song_number: document.getElementById('e-song').value,
                date: document.getElementById('e-date').value,
                time: document.getElementById('e-time').value,
                comments: document.getElementById('e-comments').value
            };
            localStorage.setItem('draft_outgoing', JSON.stringify(draft));
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                saveDraft();
                this.closeModal();
            }
        };

        form.addEventListener('input', saveDraft);
        form.addEventListener('change', saveDraft); // Listen to select changes
    },

    clearForm() {
        if (confirm('¿Estás seguro de limpiar todo el formulario?')) {
            document.getElementById('event-form').reset();
            localStorage.removeItem('draft_outgoing');
        }
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
        window.onclick = null;
    },

    shareWhatsApp(id, target) {
        import('../services/NotificationService.js').then(({ NotificationService }) => {
            NotificationService.openWhatsApp('outgoing', id, target);
        });
    },

    sharePreview(id) {
        const event = State.outgoing.find(e => e.id === id);
        if (event) {
            window.router.navigate('reports');
            setTimeout(() => {
                document.getElementById('filter-start').value = event.date;
                document.getElementById('filter-end').value = event.date;
                document.getElementById('filter-type').value = 'Van';
                document.getElementById('btn-filter').click();
                window.showToast('Previsualización de salida lista', 'info');
            }, 500);
        }
    },

    autoFill(speakerId, outline = null) {
        if (!speakerId) return;
        const speaker = State.authorized.find(s => s.id === speakerId);
        if (!speaker) return;

        if (outline) {
            const talk = speaker.talks.find(t => t.outline === outline);
            if (talk) {
                document.getElementById('e-title').value = talk.title;
                document.getElementById('e-song').value = talk.song || '';
            }
        } else {
            // If only speaker changed, find the first talk
            if (speaker.talks.length === 1) {
                document.getElementById('e-outline').value = speaker.talks[0].outline;
                document.getElementById('e-title').value = speaker.talks[0].title;
                document.getElementById('e-song').value = speaker.talks[0].song || '';
            }
        }
    },

    handleSave(id) {
        const data = {
            id: id || crypto.randomUUID(),
            speaker_id: document.getElementById('e-speaker').value,
            destination_congregation: document.getElementById('e-destination').value,
            outline_number: document.getElementById('e-outline').value,
            talk_title: document.getElementById('e-title').value,
            song_number: document.getElementById('e-song').value,
            date: document.getElementById('e-date').value,
            time: document.getElementById('e-time').value,
            comments: document.getElementById('e-comments').value
        };

        // Frequency Validation: One outing per month
        if (data.speaker_id && data.date) {
            const monthStr = data.date.substring(0, 7);
            const duplicate = State.outgoing.find(e =>
                e.speaker_id === data.speaker_id &&
                e.date.startsWith(monthStr) &&
                e.id !== id
            );

            if (duplicate) {
                const speaker = State.authorized.find(s => s.id === data.speaker_id);
                if (!confirm(`⚠️ Aviso: ${speaker?.name || 'El hermano'} ya tiene una salida programada en este mes (${duplicate.date}).\n\n¿Deseas programarlo de nuevo de todos modos?`)) {
                    return;
                }
            }
        }

        const result = EventService.saveOutgoing(data);

        if (result.success) {
            document.getElementById('modal-container').classList.add('hidden');
            this.renderList(document.querySelector('.event-list'), State.outgoing);
            window.showToast('Salida guardada', 'success');
        } else if (result.message) {
            window.showToast(result.message, 'warning');
        }
    },

    parseSpanishDate(dateStr) {
        if (!dateStr) return '';
        const months = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12' };

        let str = dateStr.toLowerCase().replace(/^[a-z]+,\s*/, '').trim();

        for (const [monthName, monthNum] of Object.entries(months)) {
            if (str.includes(monthName)) {
                const match = str.match(/(\d{1,2})\s+de\s+[a-z]+\s+de\s+(\d{4})/);
                if (match) {
                    const d = match[1].padStart(2, '0');
                    return `${match[2]}-${monthNum}-${d}`;
                }
            }
        }

        // Handle DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = dateStr.match(/(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
        if (dmyMatch) {
            const d = dmyMatch[1].padStart(2, '0');
            const m = dmyMatch[2].padStart(2, '0');
            const y = dmyMatch[3];
            return `${y}-${m}-${d}`;
        }

        const d = new Date(dateStr);
        if (!isNaN(d)) return d.toISOString().split('T')[0];
        return '';
    },

    parseTime(timeStr) {
        if (!timeStr) return '10:00';
        let match = timeStr.match(/(\d{1,2}):(\d{2})([^a-z]*)([ap]\.?\s?m\.?)/i);
        if (match) {
            let h = parseInt(match[1]);
            const m = match[2];
            const ampm = match[4].toLowerCase().replace(/\./g, '').trim();
            if (ampm === 'pm' && h < 12) h += 12;
            if (ampm === 'am' && h === 12) h = 0;
            return `${h.toString().padStart(2, '0')}:${m}`;
        }
        // Handle 24h format HH:MM
        let hm = timeStr.match(/(\d{1,2}):(\d{2})/);
        if (hm) return `${hm[1].padStart(2, '0')}:${hm[2]}`;
        return '10:00';
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
                    // Cols: Congregación | Contacto | Domicilio | Nombre discursante | No. Bosquejo | Título | Fecha | Horario | Comentarios
                    if (isFirstRow && row[0].toLowerCase().includes('congregaci')) { isFirstRow = false; continue; }
                    if (row.length < 7) continue;

                    const congregation = row[0].trim();
                    const contactRaw = row[1] ? row[1].trim() : '';
                    const address = row[2] ? row[2].trim() : '';
                    const speakerName = row[3] ? row[3].trim() : '';
                    const outline = row[4] ? row[4].trim() : '';
                    const title = row[5] ? row[5].trim() : '';
                    const rawDate = row[6] || '';
                    const rawTime = row[7] || '';
                    const comments = row[8] || '';

                    if (!speakerName || !title || !rawDate) continue;

                    const formattedDate = this.parseSpanishDate(rawDate);
                    if (!formattedDate) continue;

                    const formattedTime = this.parseTime(rawTime);

                    // Add to masters if new and has info
                    if (congregation && (contactRaw || address)) {
                        const exists = State.destinations.find(d => d.name.toLowerCase() === congregation.toLowerCase());
                        if (!exists) {
                            const phoneMatch = contactRaw.match(/(\+?\d[\d\s-]{7,}\d)/);
                            const phone = phoneMatch ? PhoneUtils.validate(phoneMatch[1]) : '';
                            const name = contactRaw.replace(phoneMatch ? phoneMatch[1] : '', '').trim();
                            State.destinations.push({
                                id: crypto.randomUUID(),
                                name: congregation,
                                address: address,
                                contact_name: name || 'Coordinador',
                                contact_phone: phone,
                                meeting_day: '', meeting_time: formattedTime
                            });
                            State.saveToStorage('speaker_app_destinations', State.destinations);
                        }
                    }

                    // Find or create speaker
                    let speaker = State.authorized.find(s => s.name.toLowerCase() === speakerName.toLowerCase());
                    if (!speaker) {
                        speaker = {
                            id: crypto.randomUUID(),
                            name: speakerName,
                            phone: '',
                            contact_secondary: '',
                            comments: 'Auto-importado',
                            talks: []
                        };
                        State.authorized.push(speaker);
                        State.saveToStorage('speaker_app_authorized', State.authorized);
                    }

                    // Add talk if missing
                    if (!speaker.talks.find(t => t.outline == outline) && outline) {
                        speaker.talks.push({ outline, title, song: '' });
                        State.saveToStorage('speaker_app_authorized', State.authorized);
                    }

                    const data = {
                        id: crypto.randomUUID(),
                        speaker_id: speaker.id,
                        destination_congregation: congregation,
                        outline_number: outline,
                        talk_title: title,
                        song_number: '',
                        date: formattedDate,
                        time: formattedTime,
                        comments: comments
                    };

                    State.outgoing.push(data);
                    parsedCount++;
                }

                State.saveToStorage('speaker_app_outgoing', State.outgoing);
                this.renderList(document.querySelector('.event-list'), State.outgoing);
                window.showToast(`Se importaron ${parsedCount} salidas`, 'success');

            } catch (error) {
                console.error("Error importing CSV:", error);
                window.showToast('Error al importar CSV', 'danger');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }
};

window.Outgoing = Outgoing;
