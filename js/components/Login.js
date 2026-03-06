import { AuthService } from '../services/AuthService.js';

export const Login = {
    render() {
        const container = document.createElement('div');
        container.className = 'login-view';
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 80vh;
            padding: 2rem;
            text-align: center;
        `;

        container.innerHTML = `
            <div class="card neon-card-purple" style="max-width: 450px; width: 100%; padding: 3rem 2rem; border-radius: 30px; background: rgba(15, 15, 25, 0.8); backdrop-filter: blur(20px);">
                <div class="login-header" style="margin-bottom: 2.5rem;">
                    <div style="background: var(--primary); width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);">
                        <i data-lucide="shield-check" style="color: white; width: 40px; height: 40px;"></i>
                    </div>
                    <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: white;">Acceso Privado</h1>
                    <p style="color: #94a3b8; font-size: 1.1rem;">Inicia sesión para sincronizar tu Excel personal en OneDrive.</p>
                </div>

                <div class="auth-providers" style="display: flex; flex-direction: column; gap: 1rem; width: 100%;">
                    <button class="btn-auth google" onclick="Login.handleLogin('google')">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20">
                        Continuar con Google
                    </button>
                    
                    <button class="btn-auth microsoft" onclick="Login.handleLogin('microsoft')">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" width="20">
                        Continuar con Outlook / Microsoft
                    </button>

                    <button class="btn-auth github" onclick="Login.handleLogin('github')">
                        <i data-lucide="github" style="width: 20px;"></i>
                        Continuar con GitHub
                    </button>

                    <button class="btn-auth facebook" onclick="Login.handleLogin('facebook')">
                        <i data-lucide="facebook" style="width: 20px; color: #1877F2;"></i>
                        Continuar con Facebook
                    </button>
                </div>

                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <p style="font-size: 0.85rem; color: #64748b; line-height: 1.5;">
                        <i data-lucide="info" style="width: 14px; vertical-align: middle;"></i>
                        Tus datos se guardan de forma segura en tu propio OneDrive. La aplicación no almacena tus credenciales.
                    </p>
                </div>
            </div>

            <style>
                .btn-auth {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                    background: rgba(255,255,255,0.05);
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-size: 1rem;
                }
                .btn-auth:hover {
                    background: rgba(255,255,255,0.1);
                    transform: translateY(-2px);
                    border-color: var(--primary);
                }
                .btn-auth.microsoft:hover {
                    border-color: #00a4ef;
                    box-shadow: 0 0 15px rgba(0, 164, 239, 0.2);
                }
                .btn-auth.google:hover {
                    border-color: #ea4335;
                    box-shadow: 0 0 15px rgba(234, 67, 53, 0.2);
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
                window.showToast(`Bienvenido, ${user.displayName}`, 'success');
                setTimeout(() => {
                    window.router.navigate('dashboard');
                }, 1000);
            }
        } catch (error) {
            window.showToast('Error al iniciar sesión', 'danger');
        }
    }
};

window.Login = Login;
