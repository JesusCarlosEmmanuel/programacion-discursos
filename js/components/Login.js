export const Login = {
    render() {
        // Redirect if already logged in
        if (window.AuthService && window.AuthService.isAuthenticated()) {
            setTimeout(() => window.router.navigate('dashboard'), 0);
            return document.createElement('div');
        }

        const container = document.createElement('div');
        container.className = 'login-landing';
        container.style.cssText = `
            display: flex;
            min-height: 100vh;
            background: #f8fafc;
            color: #0f172a;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            z-index: 1000;
        `;

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
                            <span style="font-weight: 500;">Sincronización multidispositivo con Google</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i data-lucide="check-circle-2" style="color: #10b981; width: 22px;"></i>
                            <span style="font-weight: 500;">Generación de reportes profesionales</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="login-right" style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div class="login-box card" style="width: 100%; max-width: 420px; padding: 2.5rem; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <h2 style="font-size: 1.5rem; font-weight: 700;">Bienvenido</h2>
                        <p style="color: #64748b; font-size: 0.95rem;">Inicia sesión para continuar</p>
                    </div>

                    <form id="email-login-form" onsubmit="event.preventDefault(); window.Login.handleLogin('email')" style="display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem;">
                        <div class="form-group">
                            <label>Correo electrónico</label>
                            <input type="email" placeholder="nombre@ejemplo.com" required>
                        </div>
                        <div class="form-group">
                            <label>Contraseña</label>
                            <input type="password" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="padding: 0.8rem; width: 100%; font-size: 1rem;">
                            Iniciar Sesión
                        </button>
                    </form>

                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem;">
                        <div style="height: 1px; background: #e2e8f0; flex: 1;"></div>
                        <span style="font-size: 0.8rem; color: #94a3b8; text-transform: uppercase;">O continuar con</span>
                        <div style="height: 1px; background: #e2e8f0; flex: 1;"></div>
                    </div>

                    <div class="social-auth" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <button class="social-btn" onclick="window.Login.handleLogin('google')">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18"> Google
                        </button>
                        <button class="social-btn" onclick="window.Login.handleLogin('microsoft')">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" width="18"> Outlook
                        </button>
                        <button class="social-btn" onclick="window.Login.handleLogin('facebook')">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" width="18"> Facebook
                        </button>
                        <button class="social-btn" onclick="window.Login.handleLogin('instagram')">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" width="18"> Instagram
                        </button>
                    </div>

                    <p style="margin-top: 2rem; text-align: center; font-size: 0.9rem; color: #64748b;">
                        ¿No tienes cuenta? <a href="#" style="color: var(--primary); font-weight: 600; text-decoration: none;">Regístrate</a>
                    </p>
                </div>
            </div>

            <style>
                @media (max-width: 900px) {
                    .login-left { display: none !important; }
                    .login-landing { background: #ffffff !important; }
                    .login-box { box-shadow: none !important; border: none !important; }
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
                .social-btn:hover {
                    background: #f1f5f9;
                    border-color: #cbd5e1;
                }
            </style>
        `;

        if (window.lucide) window.lucide.createIcons();
        return container;
    },

    async handleLogin(provider) {
        window.showToast(`Conectando con ${provider}...`, 'info');
        try {
            const user = await AuthService.login(provider);
            if (user) {
                window.showToast(`Bienvenido de nuevo`, 'success');
                setTimeout(() => window.router.navigate('dashboard'), 500);
            }
        } catch (error) {
            window.showToast('Error en la autenticación', 'danger');
        }
    }
};

window.Login = Login;
