export const Login = {
    mode: 'login', // 'login' or 'register'

    render() {
        const user = window.AuthService ? window.AuthService.user : null;

        // --- PROFILE VIEW (IF LOGGED IN) ---
        if (user) {
            const container = document.createElement('div');
            container.className = 'profile-view view-container';
            container.innerHTML = `
                <div class="view-header">
                    <h2>Mi Cuenta</h2>
                </div>
                
                <div class="card profile-card" style="text-align: center; padding: 3rem 2rem;">
                    <div style="position: relative; display: inline-block; margin-bottom: 1.5rem;">
                        <img src="${user.photoURL}" alt="Avatar" style="width: 120px; height: 120px; border-radius: 60px; border: 4px solid var(--primary-glow); object-fit: cover;">
                        <div style="position: absolute; bottom: 5px; right: 5px; background: white; border-radius: 50%; padding: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                            <img src="${this.getProviderIcon(user.provider)}" width="20">
                        </div>
                    </div>
                    
                    <h3 style="font-size: 1.6rem; font-weight: 700; margin-bottom: 0.25rem;">${user.displayName}</h3>
                    <p style="color: var(--text-dim); margin-bottom: 2rem;">${user.email}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; border-top: 1px solid var(--card-border); padding-top: 2rem;">
                        <div style="text-align: left;">
                            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Estado de Nube</label>
                            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                                <div style="width: 10px; height: 10px; border-radius: 50%; background: #10b981;"></div>
                                <span style="font-weight: 600; font-size: 0.9rem;">Sincronizado</span>
                            </div>
                        </div>
                        <div style="text-align: left;">
                            <label style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Proveedor</label>
                            <p style="font-weight: 600; font-size: 0.9rem; margin-top: 4px; text-transform: capitalize;">${user.provider}</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        <button class="btn btn-secondary" onclick="window.router.navigate('dashboard')" style="width: 100%;">
                            <i data-lucide="layout-dashboard"></i> Ir al Panel
                        </button>
                        <button class="btn btn-danger" onclick="window.AuthService.logout()" style="width: 100%;">
                            <i data-lucide="log-out"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div class="card" style="margin-top: 1rem; padding: 1.25rem; background: #f8fafc; border-style: dashed;">
                    <p style="font-size: 0.85rem; color: var(--text-dim); line-height: 1.5;">
                        <i data-lucide="shield-check" style="width: 16px; vertical-align: middle; color: var(--primary);"></i>
                        Tu sesión está protegida por Firebase. Tus datos de discursos se guardan automáticamente en tu espacio privado cada vez que haces un cambio.
                    </p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return container;
        }

        // --- LOGIN / REGISTER VIEW (IF NOT LOGGED IN) ---
        const container = document.createElement('div');
        container.className = 'login-landing';
        container.style.cssText = `
            display: flex;
            min-height: 100vh;
            background: #f8fafc;
            color: #0f172a;
            position: fixed;
            top: 0; left: 0; width: 100%; z-index: 1000;
        `;

        const isLogin = this.mode === 'login';

        container.innerHTML = `
            <div class="login-left" style="flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 4rem; background: #ffffff; border-right: 1px solid #e2e8f0;">
                <div style="max-width: 500px; margin: 0 auto;">
                    <div style="background: var(--primary); width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px var(--primary-glow);">
                        <i data-lucide="mic-2" style="color: white; width: 32px; height: 32px;"></i>
                    </div>
                    <h1 style="font-size: 3rem; font-weight: 800; line-height: 1.1; margin-bottom: 1.5rem; color: #0f172a; letter-spacing: -1px;">
                        Gestiona tus discursos con <span style="color: var(--primary)">inteligencia.</span>
                    </h1>
                    <p style="font-size: 1.15rem; color: #64748b; line-height: 1.6; margin-bottom: 2.5rem;">
                        Herramienta profesional para la programación de oradores, análisis de fechas y sincronización segura en la nube.
                    </p>
                    <div style="display: flex; flex-direction: column; gap: 1rem;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i data-lucide="check-circle-2" style="color: #10b981; width: 22px;"></i>
                            <span style="font-weight: 500;">Escáner inteligente de programaciones</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i data-lucide="check-circle-2" style="color: #10b981; width: 22px;"></i>
                            <span style="font-weight: 500;">Sincronización multidispositivo</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="login-right" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div class="login-box card" style="width: 100%; max-width: 420px; padding: 2.5rem; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <h2 style="font-size: 1.5rem; font-weight: 700;">${isLogin ? 'Bienvenido' : 'Crear Cuenta'}</h2>
                        <p style="color: #64748b; font-size: 0.95rem;">${isLogin ? 'Inicia sesión para continuar' : 'Únete a la plataforma profesional'}</p>
                    </div>

                    <form id="auth-form" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                        ${!isLogin ? `
                        <div class="form-group">
                            <label>Nombre Completo</label>
                            <input type="text" id="reg-name" placeholder="Tu nombre" required>
                        </div>
                        ` : ''}
                        <div class="form-group">
                            <label>Correo electrónico</label>
                            <input type="email" id="auth-email" placeholder="nombre@ejemplo.com" required>
                        </div>
                        <div class="form-group">
                            <label>Contraseña</label>
                            <input type="password" id="auth-pass" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="padding: 0.8rem; width: 100%; font-size: 1rem;">
                            ${isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                        </button>
                    </form>

                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem;">
                        <div style="height: 1px; background: #e2e8f0; flex: 1;"></div>
                        <span style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">O continuar con</span>
                        <div style="height: 1px; background: #e2e8f0; flex: 1;"></div>
                    </div>

                    <div class="social-auth" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button class="social-btn" onclick="window.Login.handleSocial('google')">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18"> Google
                        </button>
                        <button class="social-btn" onclick="window.Login.handleSocial('microsoft')">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" width="18"> Outlook
                        </button>
                        <button class="social-btn" onclick="window.Login.handleSocial('facebook')">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" width="18"> Facebook
                        </button>
                        <button class="social-btn" onclick="window.Login.handleSocial('instagram')">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" width="18"> Instagram
                        </button>
                    </div>

                    <p style="margin-top: 2rem; text-align: center; font-size: 0.9rem; color: #64748b;">
                        ${isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'} 
                        <a href="javascript:void(0)" onclick="window.Login.toggleMode()" style="color: var(--primary); font-weight: 600; text-decoration: none;">
                            ${isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </a>
                    </p>
                </div>
            </div>

            <style>
                @media (max-width: 900px) {
                    .login-left { display: none !important; }
                    .login-landing { background: #ffffff !important; }
                    .login-box { box-shadow: none !important; border: none !important; padding: 1.5rem !important; }
                }
                .social-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 0.6rem;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    background: #ffffff;
                    color: #0f172a;
                    font-size: 0.85rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .social-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
                .profile-card { max-width: 500px; margin: 0 auto; }
            </style>
        `;

        // Action binding
        setTimeout(() => {
            const form = container.querySelector('#auth-form');
            if (form) {
                form.onsubmit = (e) => {
                    e.preventDefault();
                    this.handleAction();
                };
            }
        }, 0);

        if (window.lucide) window.lucide.createIcons();
        return container;
    },

    getProviderIcon(provider) {
        if (provider.includes('google')) return 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';
        if (provider.includes('facebook')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg';
        if (provider.includes('microsoft')) return 'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg';
        return 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/mail.svg';
    },

    toggleMode() {
        this.mode = this.mode === 'login' ? 'register' : 'login';
        window.router.navigate('login');
    },

    async handleSocial(provider) {
        if (provider === 'instagram') {
            window.showToast("Inicio con Instagram vía Facebook próximamente.", "info");
            return;
        }
        window.showToast(`Conectando con ${provider}...`, 'info');
        try {
            const user = await window.AuthService.login(provider);
            if (user) {
                window.showToast(`Bienvenido`, 'success');
                setTimeout(() => window.router.navigate('dashboard'), 500);
            }
        } catch (error) {
            console.error(error);
        }
    },

    async handleAction() {
        const email = document.getElementById('auth-email').value;
        const pass = document.getElementById('auth-pass').value;
        
        try {
            if (this.mode === 'login') {
                window.showToast("Iniciando sesión...", "info");
                const user = await window.AuthService.login('email', { email, password: pass });
                if (user) {
                    window.showToast("Bienvenido", "success");
                    window.router.navigate('dashboard');
                }
            } else {
                const name = document.getElementById('reg-name').value;
                window.showToast("Creando cuenta...", "info");
                const user = await window.AuthService.register(email, pass, name);
                if (user) {
                    window.showToast("Cuenta creada con éxito", "success");
                    window.router.navigate('dashboard');
                }
            }
        } catch (e) {
            // Error handling in AuthService
        }
    }
};

window.Login = Login;
