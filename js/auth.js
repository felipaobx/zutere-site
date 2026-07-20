/* ==========================================================================
   ZUTERE AUDIOVISUAL - AUTHENTICATION & SECURITY GUARD
   ========================================================================== */

(function () {
  'use strict';

  const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'zutere123'
  };

  function getCredentials() {
    const saved = localStorage.getItem('zutere_admin_credentials');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    localStorage.setItem('zutere_admin_credentials', JSON.stringify(DEFAULT_CREDENTIALS));
    return DEFAULT_CREDENTIALS;
  }

  function isAuthenticated() {
    return sessionStorage.getItem('zutere_admin_logged') === 'true';
  }

  window.logoutAdmin = function () {
    sessionStorage.removeItem('zutere_admin_logged');
    location.reload();
  };

  window.updateAdminCredentials = function (newUsername, newPassword) {
    if (!newUsername || !newPassword) return false;
    const creds = { username: newUsername.trim(), password: newPassword.trim() };
    localStorage.setItem('zutere_admin_credentials', JSON.stringify(creds));
    return true;
  };

  function createLoginOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'adminLoginOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #07090E;
      background: radial-gradient(circle at center, #141A29 0%, #07090E 100%);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      font-family: 'Inter', sans-serif;
    `;

    overlay.innerHTML = `
      <div style="background: rgba(18, 22, 34, 0.85); backdrop-filter: blur(20px); border: 1px solid rgba(255, 91, 0, 0.3); border-radius: 24px; padding: 40px 32px; width: 100%; max-width: 420px; box-shadow: 0 25px 50px rgba(0,0,0,0.6); text-align: center;">
        <img src="assets/logo.png" alt="Zutere Audiovisual" style="height: 60px; width: auto; margin-bottom: 16px; display: inline-block;">
        <h2 style="font-family: 'Montserrat', sans-serif; font-size: 1.4rem; font-weight: 800; color: #FFFFFF; margin: 0 0 6px 0;">ÁREA RESTRITA</h2>
        <p style="font-size: 0.88rem; color: #94A3B8; margin: 0 0 26px 0;">Digite suas credenciais para acessar o painel de administração.</p>

        <form id="formAdminLogin">
          <div style="text-align: left; margin-bottom: 16px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #CBD5E1; margin-bottom: 6px;"><i class="fa-solid fa-user" style="color:#FF5B00;"></i> Usuário</label>
            <input type="text" id="inputAuthUser" required placeholder="Digite o usuário" style="width: 100%; padding: 12px 16px; background: rgba(10, 13, 20, 0.8); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #FFF; font-size: 0.95rem; outline: none; box-sizing: border-box;">
          </div>

          <div style="text-align: left; margin-bottom: 24px;">
            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #CBD5E1; margin-bottom: 6px;"><i class="fa-solid fa-lock" style="color:#FF5B00;"></i> Senha</label>
            <input type="password" id="inputAuthPass" required placeholder="Digite a senha" style="width: 100%; padding: 12px 16px; background: rgba(10, 13, 20, 0.8); border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; color: #FFF; font-size: 0.95rem; outline: none; box-sizing: border-box;">
          </div>

          <div id="authErrorMsg" style="display: none; background: rgba(239, 68, 68, 0.15); border: 1px solid #EF4444; color: #FCA5A5; padding: 10px; border-radius: 10px; font-size: 0.85rem; margin-bottom: 18px;">
            <i class="fa-solid fa-triangle-exclamation"></i> Usuário ou senha incorretos!
          </div>

          <button type="submit" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #FF5B00 0%, #FF8800 100%); border: none; border-radius: 12px; color: #FFFFFF; font-weight: 800; font-size: 1rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(255,91,0,0.4);">
            <i class="fa-solid fa-right-to-bracket"></i> Entrar no Painel
          </button>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const form = document.getElementById('formAdminLogin');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = document.getElementById('inputAuthUser').value.trim();
      const pass = document.getElementById('inputAuthPass').value.trim();
      const creds = getCredentials();

      if (user === creds.username && pass === creds.password) {
        sessionStorage.setItem('zutere_admin_logged', 'true');
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => overlay.remove(), 300);
      } else {
        const errorBox = document.getElementById('authErrorMsg');
        errorBox.style.display = 'block';
        document.getElementById('inputAuthPass').value = '';
        document.getElementById('inputAuthPass').focus();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!isAuthenticated()) {
      createLoginOverlay();
    }
  });

})();
