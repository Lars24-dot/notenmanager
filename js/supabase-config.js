/* supabase-config.js — Zugangsdaten für den optionalen Cloud-Sync.
 *
 * Ohne Eintrag hier läuft die App genau wie bisher rein lokal (LocalStorage,
 * kein Login). Trage Project URL und anon/public Key aus deinem Supabase-
 * Projekt ein (Project Settings → API), um Login + Sync zwischen Geräten
 * zu aktivieren. Setup-Anleitung: siehe SUPABASE_SETUP.md.
 */

const SUPABASE_URL = '';
const SUPABASE_ANON_KEY = '';

const CLOUD_SYNC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabaseClient = CLOUD_SYNC_ENABLED
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
