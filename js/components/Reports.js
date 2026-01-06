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
                <div class="form-group-row" style="display:flex; gap:10px; align-items:flex-end">
                    <div style="flex:1">
                        <label>Desde</label>
                        <input type="date" id="filter-start">
                    </div>
                    <div style="flex:1">
                        <label>Hasta</label>
                        <input type="date" id="filter-end">
                    </div>
                    <button class="btn btn-primary" id="btn-filter">
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
                <button class="btn btn-secondary" id="btn-share-img">
                    <i data-lucide="share-2"></i> Compartir Imagen
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

        // Initial generation
        setTimeout(() => this.generateReport(container), 100);

        return container;
    },

    generateReport(container) {
        const start = container.querySelector('#filter-start').value;
        const end = container.querySelector('#filter-end').value;
        const reportContent = container.querySelector('#report-content');
        const rangeText = container.querySelector('#report-range-text');

        rangeText.textContent = `${start} al ${end}`;

        const allEvents = [
            ...State.outgoing.map(e => ({ ...e, type: 'Van' })),
            ...State.incoming.map(e => ({ ...e, type: 'Viene' }))
        ].filter(e => {
            if (!start || !end) return true;
            return e.date >= start && e.date <= end;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

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
    }
};
