/* ui-helpers.js — Toast, Modal-Steuerung, Bestätigungsdialog */

let toastTimeoutId = null;

function showToast(message, variant = 'success') {
  const toastEl = document.getElementById('toast');
  toastEl.textContent = message;
  toastEl.className = 'toast toast-' + variant;
  toastEl.hidden = false;
  requestAnimationFrame(() => toastEl.classList.add('toast-visible'));

  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove('toast-visible');
    setTimeout(() => { toastEl.hidden = true; }, 220);
  }, 2600);
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.dataset.gen = String(Number(modal.dataset.gen || 0) + 1);
  modal.hidden = false;
  modal.classList.remove('modal-visible');
  void modal.offsetWidth; // force reflow so the enter transition runs from the start state
  requestAnimationFrame(() => modal.classList.add('modal-visible'));
  document.body.classList.add('modal-open');
  const firstInput = modal.querySelector('input, select, button');
  if (firstInput) setTimeout(() => firstInput.focus(), 0);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal.hidden) return;
  const gen = String(Number(modal.dataset.gen || 0) + 1);
  modal.dataset.gen = gen;
  modal.classList.remove('modal-visible');

  const finish = () => {
    if (modal.dataset.gen !== gen) return; // reopened before the exit animation finished
    modal.hidden = true;
    const anyOpen = document.querySelectorAll('.modal-overlay:not([hidden])').length > 0;
    if (!anyOpen) document.body.classList.remove('modal-open');
  };

  const panel = modal.querySelector('.modal');
  if (panel && !prefersReducedMotion()) {
    panel.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 260); // fallback in case transitionend doesn't fire
  } else {
    finish();
  }
}

function initModalDismissHandlers() {
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
  });
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not([hidden])').forEach(m => closeModal(m.id));
    }
  });
}

let confirmResolver = null;

function confirmDialog(message, { title = 'Bist du sicher?', okLabel = 'Löschen' } = {}) {
  const modal = document.getElementById('confirmModal');
  document.getElementById('confirmModalTitle').textContent = title;
  document.getElementById('confirmModalMessage').textContent = message;
  const okBtn = document.getElementById('confirmOkBtn');
  okBtn.textContent = okLabel;
  openModal('confirmModal');

  return new Promise((resolve) => {
    confirmResolver = resolve;
  });
}

function initConfirmDialogHandlers() {
  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    closeModal('confirmModal');
    if (confirmResolver) { confirmResolver(true); confirmResolver = null; }
  });
  document.getElementById('confirmCancelBtn').addEventListener('click', () => {
    closeModal('confirmModal');
    if (confirmResolver) { confirmResolver(false); confirmResolver = null; }
  });
}

/* ---------- "Mehr"-Dropdown-Menü (Backup, Schuljahr löschen) ---------- */

let menuGeneration = 0;

function isDropdownMenuOpen() {
  return document.getElementById('moreMenu').classList.contains('menu-visible');
}

function openDropdownMenu() {
  const menu = document.getElementById('moreMenu');
  const btn = document.getElementById('moreMenuBtn');
  menuGeneration++;
  menu.hidden = false;
  void menu.offsetWidth; // force reflow so the enter transition runs from the start state
  requestAnimationFrame(() => menu.classList.add('menu-visible'));
  btn.setAttribute('aria-expanded', 'true');
}

function closeDropdownMenu() {
  const menu = document.getElementById('moreMenu');
  const btn = document.getElementById('moreMenuBtn');
  if (menu.hidden && !menu.classList.contains('menu-visible')) return;

  const gen = ++menuGeneration;
  menu.classList.remove('menu-visible');
  btn.setAttribute('aria-expanded', 'false');

  const finish = () => {
    if (gen !== menuGeneration) return; // reopened before the exit animation finished
    menu.hidden = true;
  };
  if (!prefersReducedMotion()) {
    menu.addEventListener('transitionend', finish, { once: true });
    setTimeout(finish, 220);
  } else {
    finish();
  }
}

function initDropdownMenuHandlers() {
  const btn = document.getElementById('moreMenuBtn');
  const menu = document.getElementById('moreMenu');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isDropdownMenuOpen()) closeDropdownMenu(); else openDropdownMenu();
  });

  document.addEventListener('click', (e) => {
    if (isDropdownMenuOpen() && !menu.contains(e.target) && e.target !== btn) closeDropdownMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isDropdownMenuOpen()) closeDropdownMenu();
  });

  menu.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => closeDropdownMenu());
  });
}

/* ---------- Dark Mode ---------- */

const THEME_STORAGE_KEY = 'notenmanager.theme.v1';

function getStoredTheme() {
  const value = localStorage.getItem(THEME_STORAGE_KEY);
  return value === 'light' || value === 'dark' ? value : null;
}

function getEffectiveTheme() {
  return getStoredTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  btn.setAttribute('aria-label', theme === 'dark' ? 'Zu hellem Modus wechseln' : 'Zu dunklem Modus wechseln');
}

function initTheme() {
  applyTheme(getEffectiveTheme());

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
  });

  document.getElementById('themeToggleBtn').addEventListener('click', () => {
    const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_STORAGE_KEY, next);
    applyTheme(next);
  });
}
