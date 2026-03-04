import { State } from '../context/state.js';

export const Reports = {
    render() {
        const container = document.createElement('div');
        container.className = 'reports-view';

        container.innerHTML = `
            <div class="view-header">
                <h2>Reportes</h2>
            </div>

            <div class="card filter-card">
                <div class="form-group-row" style="display:flex; flex-wrap:wrap; gap:10px; align-items:flex-end">
                    <div style="flex:1; min-width: 120px">
                        <label>Desde</label>
                        <input type="date" id="filter-start">
                    </div>
                    <div style="flex:1; min-width: 120px">
                        <label>Hasta</label>
                        <input type="date" id="filter-end">
                    </div>
                    <div style="flex:1; min-width: 120px">
                        <label>Tipo</label>
                        <select id="filter-type">
                            <option value="all">Todos</option>
                            <option value="Van">Salidas (Van)</option>
                            <option value="Viene">Visitas (Vienen)</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" id="btn-filter" style="height: 42px">
                        <i data-lucide="filter"></i>
                    </button>
                </div>
            </div>

            <div id="report-landscape" class="report-container">
                <div class="report-header">
                    <h3>Programación de Discursos</h3>
                    <p id="report-range-text">Todos los registros</p>
                </div>
                <div id="report-content" class="report-table">
                    <!-- Table injected here -->
                </div>
            </div>

            <div class="report-actions">
                <button class="btn btn-secondary" id="btn-share-wa">
                    <i data-lucide="message-square"></i> WhatsApp
                </button>
                <button class="btn btn-secondary" id="btn-share-img">
                    <i data-lucide="image"></i> Imagen
                </button>
                <button class="btn btn-secondary" id="btn-share-pdf">
                    <i data-lucide="file-text"></i> PDF
                </button>
            </div>
        `;

        const startInput = container.querySelector('#filter-start');
        const endInput = container.querySelector('#filter-end');

        // Auto-set current month
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0];
        startInput.value = firstDay;
        endInput.value = lastDay;

        container.querySelector('#btn-filter').addEventListener('click', () => this.generateReport(container));
        container.querySelector('#btn-share-img').addEventListener('click', () => this.shareAsImage());
        container.querySelector('#btn-share-pdf').addEventListener('click', () => this.shareAsPDF());
        container.querySelector('#btn-share-wa').addEventListener('click', () => {
            if (!this.lastEvents) return window.showToast('Generando reporte primero', 'warning');
            const typeFilter = container.querySelector('#filter-type').value;
            const rangeText = container.querySelector('#report-range-text').textContent;
            import('../services/NotificationService.js').then(({ NotificationService }) => {
                NotificationService.shareSupervisorReport(this.lastEvents, rangeText, typeFilter);
            });
        });

        // Initial generation
        setTimeout(() => this.generateReport(container), 100);

        return container;
    },

    generateReport(container) {
        const start = container.querySelector('#filter-start').value;
        const end = container.querySelector('#filter-end').value;
        const type = container.querySelector('#filter-type').value;
        const reportContent = container.querySelector('#report-content');
        const rangeText = container.querySelector('#report-range-text');

        const dateRange = start && end ? `${start} al ${end}` : 'Todo el tiempo';
        const typeText = type === 'all' ? '' : ` (${type})`;
        rangeText.textContent = `${dateRange}${typeText}`;

        const allEvents = [
            ...State.outgoing.map(e => ({ ...e, type: 'Van' })),
            ...State.incoming.map(e => ({ ...e, type: 'Viene' }))
        ].filter(e => {
            const matchesDate = (!start || !end) ? true : (e.date >= start && e.date <= end);
            const matchesType = type === 'all' || e.type === type;
            return matchesDate && matchesType;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        this.lastEvents = allEvents;

        if (allEvents.length === 0) {
            reportContent.innerHTML = '<p class="empty-state">No hay datos en este rango.</p>';
            return;
        }

        reportContent.innerHTML = `
            <table class="premium-table">
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Discursante</th>
                        <th>Discurso</th>
                        <th>Congregación</th>
                    </tr>
                </thead>
                <tbody>
                    ${allEvents.map(e => {
            const speakerName = e.type === 'Van'
                ? (State.authorized.find(s => s.id === e.speaker_id)?.name || '---')
                : e.speaker_name;
            const cong = e.type === 'Van' ? e.destination_congregation : e.congregation_origin;

            return `
                            <tr>
                                <td class="td-date">${e.date}</td>
                                <td><span class="badge ${e.type === 'Van' ? 'badge-out' : 'badge-in'}">${e.type}</span></td>
                                <td class="td-name">${speakerName}</td>
                                <td class="td-talk">${e.talk_title}</td>
                                <td class="td-cong">${cong}</td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    async shareAsImage() {
        const element = document.getElementById('report-landscape');
        window.showToast('Generando imagen...', 'info');

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a',
                scale: 2, // Better quality
                logging: false
            });

            canvas.toBlob(async (blob) => {
                const file = new File([blob], 'programacion.png', { type: 'image/png' });

                if (navigator.share) {
                    await navigator.share({
                        files: [file],
                        title: 'Programación de Discursos',
                        text: 'Adjunto la programación de discursos.'
                    });
                } else {
                    // Fallback: download
                    const link = document.createElement('a');
                    link.download = 'programacion.png';
                    link.href = URL.createObjectURL(blob);
                    link.click();
                    window.showToast('Descargado (Navegador no soporta compartir)', 'warning');
                }
            });
        } catch (err) {
            console.error(err);
            window.showToast('Error al generar imagen', 'danger');
        }
    },

    async shareAsPDF() {
        const element = document.getElementById('report-landscape');
        window.showToast('Generando PDF...', 'info');

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a',
                scale: 2,
                logging: false,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;

            // PDF size based on landscape aspect ratio
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Programacion_Discursos_${new Date().toISOString().split('T')[0]}.pdf`);
            window.showToast('PDF descargado', 'success');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            window.showToast('Error al generar PDF', 'danger');
        }
    }
};

window.Reports = Reports;
