import { State } from '../context/state.js';

export const Authorized = {
    render() {
        const container = document.createElement('div');
        container.className = 'authorized-view';

        container.innerHTML = `
            <div class="view-header">
                <h2>Discursantes Locales</h2>
                <button class="btn btn-primary" id="btn-add-speaker">
                    <i data-lucide="plus"></i> Nuevo
                </button>
            </div>

            <div class="speaker-list">
                ${State.authorized.length > 0 ? State.authorized.map(speaker => this.renderSpeakerCard(speaker)).join('') : '<p class="empty-state">No hay discursantes registrados.</p>'}
            </div>
        `;

        container.querySelector('#btn-add-speaker').addEventListener('click', () => this.showSpeakerModal());

        container.querySelectorAll('.btn-edit-speaker').forEach(btn => {
            btn.addEventListener('click', (e) => this.showSpeakerModal(e.currentTarget.dataset.id));
        });

        return container;
    },

    renderSpeakerCard(speaker) {
        return `
            <div class="card speaker-card">
                <div class="speaker-info">
                    <h4>${speaker.name}</h4>
                    <p>${speaker.phone}</p>
                    <span class="talk-count">${speaker.talks ? speaker.talks.length : 0} discursos</span>
                </div>
                <button class="btn btn-secondary btn-edit-speaker" data-id="${speaker.id}">
                    <i data-lucide="edit"></i>
                </button>
            </div>
        `;
    },

    showSpeakerModal(id = null) {
        const speaker = id ? State.authorized.find(s => s.id === id) : { name: '', phone: '', talks: [] };
        const modal = document.getElementById('modal-container');

        modal.innerHTML = `
            <div class="modal-content card">
                <h3>${id ? 'Editar' : 'Nuevo'} Discursante</h3>
                <form id="speaker-form">
                    <div class="form-group">
                        <label>Nombre Completo</label>
                        <input type="text" id="speaker-name" value="${speaker.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Teléfono (WhatsApp)</label>
                        <input type="tel" id="speaker-phone" value="${speaker.phone}" required placeholder="Ej: 521234567890">
                    </div>
                    
                    <div class="talks-section">
                        <label>Discursos Registrados</label>
                        <div id="talks-list">
                            ${speaker.talks.map((t, i) => this.renderTalkField(t, i)).join('')}
                        </div>
                        <button type="button" class="btn btn-secondary btn-small" id="btn-add-talk">
                            <i data-lucide="plus"></i> Añadir Discurso
                        </button>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="btn btn-secondary" id="btn-close-modal">Cancelar</button>
                        <button type="submit" class="btn btn-primary">Guardar</button>
                    </div>
                </form>
            </div>
        `;

        modal.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();

        // Modal Events
        modal.querySelector('#btn-close-modal').addEventListener('click', () => modal.classList.add('hidden'));
        modal.querySelector('#btn-add-talk').addEventListener('click', () => {
            const list = modal.querySelector('#talks-list');
            const newIndex = list.children.length;
            const div = document.createElement('div');
            div.innerHTML = this.renderTalkField({ outline: '', title: '', song: '' }, newIndex);
            list.appendChild(div.firstElementChild);
            if (window.lucide) window.lucide.createIcons();
        });

        modal.querySelector('#speaker-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSave(id);
        });
    },

    renderTalkField(talk, index) {
        return `
            <div class="talk-entry card" data-index="${index}">
                <input type="text" placeholder="Núm. Bosquejo" class="talk-outline" value="${talk.outline}" style="width: 30%; margin-right: 5%;">
                <input type="text" placeholder="Título" class="talk-title" value="${talk.title}" style="width: 60%;">
                <input type="text" placeholder="Cántico" class="talk-song" value="${talk.song}" style="width: 100%; margin-top: 5px;">
                <button type="button" class="remove-talk" onclick="this.parentElement.remove()">×</button>
            </div>
        `;
    },

    handleSave(id) {
        const name = document.getElementById('speaker-name').value;
        const phone = document.getElementById('speaker-phone').value;
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
            talks
        };

        if (id) {
            State.updateAuthorizedSpeaker(newSpeaker);
        } else {
            State.addAuthorizedSpeaker(newSpeaker);
        }

        document.getElementById('modal-container').classList.add('hidden');
        // Refresh view indirectly (Router workaround or direct call)
        document.getElementById('nav-authorized').click();
        window.showToast('Guardado correctamente', 'success');
    }
};
