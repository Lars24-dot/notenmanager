/* auth.js — Login-Gate (Magic Link) für den optionalen Cloud-Sync.
 * Ohne konfigurierten Supabase-Zugang (siehe supabase-config.js) bleibt
 * dieses Modul komplett inaktiv und die App startet wie bisher lokal.
 */

let currentUser = null;

function showAuthGate() {
  document.getElementById('appRoot').hidden = true;
  document.getElementById('authGate').hidden = false;
}

function hideAuthGate() {
  document.getElementById('authGate').hidden = true;
  document.getElementById('appRoot').hidden = false;
}

function setAuthStatus(message, variant = 'info') {
  const el = document.getElementById('authStatus');
  el.textContent = message;
  el.hidden = !message;
  el.className = 'auth-status auth-status-' + variant;
}

function updateSignOutButton() {
  const btn = document.getElementById('signOutBtn');
  if (!btn) return;
  if (CLOUD_SYNC_ENABLED && currentUser) {
    btn.hidden = false;
    btn.title = currentUser.email || '';
  } else {
    btn.hidden = true;
  }
}

function initAuthFormHandler() {
  document.getElementById('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailInput = document.getElementById('authEmail');
    const submitBtn = document.getElementById('authSubmitBtn');
    const email = emailInput.value.trim();
    if (!email) return;

    submitBtn.disabled = true;
    setAuthStatus('Sende Login-Link …', 'info');
    try {
      const { error } = await supabaseClient.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.href }
      });
      if (error) throw error;
      setAuthStatus('Link gesendet — prüfe dein Postfach (' + email + ') und öffne den Link auf diesem Gerät.', 'success');
    } catch (err) {
      setAuthStatus('Fehler: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  document.getElementById('signOutBtn').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
  });
}

/**
 * Wartet, bis ein Nutzer angemeldet ist. Zeigt bei fehlender Session das
 * Login-Gate und löst das Promise erst nach erfolgreichem Login auf.
 */
function waitForAuth() {
  return new Promise((resolve) => {
    let settled = false;

    supabaseClient.auth.onAuthStateChange((event, session) => {
      currentUser = session ? session.user : null;
      updateSignOutButton();

      if (session) {
        hideAuthGate();
        if (!settled) { settled = true; resolve(session.user); }
      } else if (settled) {
        // Nutzer hat sich nach dem Start abgemeldet — Seite neu laden,
        // damit der App-Zustand nicht mit fremden/leeren Daten weiterläuft.
        window.location.reload();
      } else {
        showAuthGate();
      }
    });
  });
}

async function initAuth() {
  if (!CLOUD_SYNC_ENABLED) return null;
  initAuthFormHandler();
  return waitForAuth();
}
