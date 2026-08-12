/* sync.js — Cloud-Sync der App-Daten zu/von Supabase.
 * Speichert die komplette Datenstruktur als ein JSONB-Feld pro Nutzer
 * (siehe SUPABASE_SETUP.md für das Tabellen-Schema). LocalStorage bleibt
 * immer die primäre Quelle für sofortige Reaktionsfähigkeit und Offline-
 * Nutzung; die Cloud wird im Hintergrund, debounced, nachgezogen.
 */

const CLOUD_TABLE = 'notenmanager_data';

let syncUserId = null;
let syncDebounceId = null;
let syncFailureNotified = false;
let lastSyncedData = null;
let pendingRetry = false;

function setSyncUser(userId) {
  syncUserId = userId;
  syncFailureNotified = false;
  lastSyncedData = null;
  pendingRetry = false;
}

window.addEventListener('online', () => {
  if (CLOUD_SYNC_ENABLED && syncUserId && pendingRetry && lastSyncedData) {
    pushPendingData();
  }
});

async function pullCloudData(userId) {
  const { data, error } = await supabaseClient
    .from(CLOUD_TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Cloud-Daten laden fehlgeschlagen', error);
    showToast('Cloud-Daten konnten nicht geladen werden — arbeite mit dem lokalen Stand weiter.', 'error');
    return null;
  }
  return data ? data.data : null;
}

async function pushCloudData(userId, data) {
  const { error } = await supabaseClient
    .from(CLOUD_TABLE)
    .upsert({ user_id: userId, data, updated_at: new Date().toISOString() });

  if (error) console.error('Cloud-Sync fehlgeschlagen', error);
  return !error;
}

async function pushPendingData() {
  const ok = await pushCloudData(syncUserId, lastSyncedData);
  if (ok) {
    pendingRetry = false;
    syncFailureNotified = false;
  } else {
    pendingRetry = true;
    if (!syncFailureNotified) {
      syncFailureNotified = true;
      showToast('Cloud-Sync fehlgeschlagen — Änderungen sind lokal gespeichert.', 'error');
    }
  }
}

/**
 * Hook, den storage.js nach jedem lokalen Speichern aufruft. Schreibt die
 * Änderung, debounced, zusätzlich in die Cloud. Schlägt der Push fehl (z.B.
 * offline), wird beim nächsten "online"-Event automatisch nachsynchronisiert.
 */
function onDataChanged(data) {
  if (!CLOUD_SYNC_ENABLED || !syncUserId) return;

  lastSyncedData = data;
  if (syncDebounceId) clearTimeout(syncDebounceId);
  syncDebounceId = setTimeout(pushPendingData, 800);
}
