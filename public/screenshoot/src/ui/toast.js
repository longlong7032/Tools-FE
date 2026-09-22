import { $ } from '../utils/dom.js';

// --- TOAST THÔNG BÁO (thành công/thất bại) ---
// Dùng thay cho alert() ở mọi nơi trong app — không chặn thao tác, tự biến mất, đồng bộ 1 chỗ.
let appToastInstance = null;

export function showToast(message, variant = 'success') {
  const toastEl = $('appToast');
  // 'success' dùng tông đen-trắng cho khớp theme chung; 'danger' giữ đỏ để nổi bật lỗi
  toastEl.classList.remove('text-bg-dark', 'text-bg-danger');
  toastEl.classList.add(variant === 'danger' ? 'text-bg-danger' : 'text-bg-dark');
  // Hỗ trợ xuống dòng (\n -> <br>) vì vài thông báo lỗi/cảnh báo khá dài, cần hiển thị rõ 2 dòng.
  // Nội dung đều do code tự tạo (không lấy trực tiếp từ input người dùng) nên an toàn khi dùng innerHTML.
  $('appToastBody').innerHTML = String(message).replace(/\n/g, '<br>');

  if (!appToastInstance) {
    appToastInstance = new bootstrap.Toast(toastEl, { delay: 5000 });
  }
  appToastInstance.show();
}
