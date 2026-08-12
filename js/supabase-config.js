/* supabase-config.js — Zugangsdaten für den optionalen Cloud-Sync.
 *
 * Ohne Eintrag hier läuft die App genau wie bisher rein lokal (LocalStorage,
 * kein Login). Trage Project URL und anon/public Key aus deinem Supabase-
 * Projekt ein (Project Settings → API), um Login + Sync zwischen Geräten
 * zu aktivieren. Setup-Anleitung: siehe SUPABASE_SETUP.md.
 */

const SUPABASE_URL = 'https://vajthfghllivcjdhwbfa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhanRoZmdobGxpdmNqZGh3YmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MDAyNzQsImV4cCI6MjEwMjA3NjI3NH0.oT3lVmS9CBd4X_CrTMNz-zen7jcAmTv_cMBxHLrrQmA';

const CLOUD_SYNC_ENABLED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

const supabaseClient = CLOUD_SYNC_ENABLED
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
