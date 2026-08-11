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
    setTimeout(() => { toastEl.hidden = true; }, 200);
  }, 2600);
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  const firstInput = modal.querySelector('input, select, button');
  if (firstInput) setTimeout(() => firstInput.focus(), 0);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.hidden = true;
  const anyOpen = document.querySelectorAll('.modal-overlay:not([hidden])').length > 0;
  if (!anyOpen) document.body.classList.remove('modal-open');
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
