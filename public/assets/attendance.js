(function () {
  'use strict';

  const BASE_URL = 'https://tool-8s0g.onrender.com';

  const toastEl = document.getElementById('liveToast');
  const toastIcon = document.getElementById('toastIcon');
  const toastBody = toastEl?.querySelector('.toast-body');
  const toastClose = toastEl?.querySelector('[data-bs-dismiss="toast"]');

  const TYPE_ICON_BG = {
    success: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300',
    danger: 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300',
  };
  const DEFAULT_ICON_BG = 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300';

  let hideTimer = null;

  function hideToast() {
    if (!toastEl) return;
    toastEl.classList.add('hidden');
  }

  function showToast(message, type) {
    if (!toastEl || !toastBody) return;
    toastBody.textContent = message;

    if (toastIcon) {
      toastIcon.className = `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TYPE_ICON_BG[type] || DEFAULT_ICON_BG}`;
    }

    toastEl.classList.remove('hidden');

    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideToast, 4000);
  }

  toastClose?.addEventListener('click', hideToast);

  async function callAttendance(path, btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    try {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/${path}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(data.message || 'Điểm danh thành công', 'success');
      } else {
        showToast(data.message || 'Điểm danh thất bại', 'danger');
      }
    } catch (err) {
      showToast('Không kết nối được tới server', 'danger');
    } finally {
      btn.disabled = false;
    }
  }

  document.getElementById('btn-check-in')?.addEventListener('click', (e) => callAttendance('check-in', e.currentTarget));
  document.getElementById('btn-check-out')?.addEventListener('click', (e) => callAttendance('check-out', e.currentTarget));
})();
