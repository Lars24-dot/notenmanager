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
