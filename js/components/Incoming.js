import { State } from '../context/state.js';
import { PhoneUtils } from '../utils/phone.js';
import { EventService } from '../services/EventService.js';
import { CSVUtils } from '../utils/csv.js';

export const Incoming = {

    selectedIds: new Set(),

    render() {
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
                <h2>Discursantes que Vienen</h2>
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
        if (window.lucide) window.lucide.createIcons();
    },

    renderList(target, list) {
        if (list.length === 0) {
            target.innerHTML = '<p class="empty-state">No hay visitas programadas.</p>';
            return;
        }

        target.innerHTML = list.sort((a, b) => new Date(a.date) - new Date(b.date)).map(e => this.renderEventCard(e)).join('');
        if (window.lucide) window.lucide.createIcons();
        this.updateSelectionBar();
    },

    renderEventCard(e) {
        const isSelected = this.selectedIds.has(e.id);
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
        const dateObj = new Date(e.date + 'T12:00:00');
        const dayName = dayNames[dateObj.getDay()];

        return `
            <div class="card event-card ${isSelected ? 'selected' : ''}" data-id="${e.id}">
                <div class="card-selection">
                    <input type="checkbox" class="bulk-check" data-id="${e.id}" onchange="Incoming.toggleSelection('${e.id}')" ${isSelected ? 'checked' : ''}>
                </div>
                <div class="event-info" onclick="Incoming.showModal('${e.id}')">
                    <div class="event-date-badge">
                        <span class="day">${dayName}</span>
                        <span class="date">${e.date.split('-')[2]}</span>
                    </div>
                    <div class="event-details">
                        <strong>${e.speaker_name}</strong>
                        <p class="origin"><i data-lucide="map-pin"></i> ${e.congregation_origin}</p>
                        <span class="talk-info">#${e.outline_number} ${e.talk_title}</span>
                    </div>
                </div>
                <div class="event-actions">
                    <button class="btn-icon" onclick="Incoming.showModal('${e.id}')">
                        <i data-lucide="edit-3"></i>
                    </button>
                    <button class="btn-icon error" onclick="Incoming.handleSingleDelete('${e.id}')">
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
        if (!confirm(`¿Eliminar ${this.selectedIds.size} visitas?`)) return;
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
                    ${id ? `<button class="btn btn-secondary btn-small" onclick="Incoming.sharePreview('${id}')"><i data-lucide="image"></i> Generar Confirmación</button>` : ''}
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
                            ${State.origins.map(o => `<option value="${o.name}">`).join('')}
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
                const selectedCong = State.origins.find(o => o.name === e.target.value);
                if (selectedCong) {
                    if (selectedCong.meeting_time) {
                        modal.querySelector('#e-time').value = selectedCong.meeting_time;
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

    sharePreview(id) {
        // This will navigate to reports with this specific event filtered
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
            return `${h.toString().padStart(2, '0')}:${m}`;
        }
        return '12:00';
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

                    const data = {
                        id: crypto.randomUUID(),
                        speaker_name: speakerName,
                        speaker_phone: phone,
                        congregation_origin: congregation,
                        outline_number: outline,
                        talk_title: title,
                        song_number: song,
                        date: formattedDate,
                        time: formattedTime,
                        comments: comments
                    };

                    State.incoming.push(data);
                    parsedCount++;
                }

                State.saveToStorage('speaker_app_incoming', State.incoming);
                this.renderList(document.querySelector('.event-list'), State.incoming);
                window.showToast(`Se importaron ${parsedCount} visitas`, 'success');

            } catch (error) {
                console.error("Error importing CSV:", error);
                window.showToast('Error al importar CSV', 'danger');
            }
            event.target.value = '';
        };
        reader.readAsText(file);
    }
};

window.Incoming = Incoming;
