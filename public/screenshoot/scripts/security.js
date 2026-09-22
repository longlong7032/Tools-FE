(function () {
  'use strict';

  // Các phím tắt DevTools/View-Source/Save phổ biến muốn chặn (không chặn được qua menu trình duyệt)
  function isBlockedShortcut(e) {
    const key = (e.key || '').toLowerCase();
    if (key === 'f12') return true; // Mở DevTools
    if (e.ctrlKey && e.shiftKey && ['i', 'j', 'c'].includes(key)) return true; // Inspect / Console / Chọn phần tử
    if (e.ctrlKey && (key === 'u' || key === 's')) return true; // Xem/Lưu source
    // macOS dùng Cmd (metaKey) thay Ctrl cho một số phím tắt DevTools
    if (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key)) return true;
    return false;
  }

  document.addEventListener('keydown', e => {
    if (isBlockedShortcut(e)) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Chặn menu chuột phải, TRỪ trên input/textarea/select — để không cản người dùng
  // paste/spell-check khi họ đang nhập liệu thật sự (Color Token JSON, tên file...)
  document.addEventListener('contextmenu', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    e.preventDefault();
  });

  // Cảnh báo trong Console — không ngăn được ai nhưng ít nhất người tò mò
  // dán code lạ vào Console (self-XSS) sẽ được nhắc trước khi làm.
  console.log(
    '%c⚠ Dừng lại!',
    'color:#dc2626; font-size:28px; font-weight:bold;'
  );
  console.log(
    '%cĐây là công cụ hộ trợ công việc. Việc dán code không rõ nguồn gốc vào đây có thể ' +
    'ảnh hưởng đến dữ liệu bạn đang thao tác. Nếu ai đó bảo bạn dán gì vào ' +
    'Console để "làm gì đó", nhiều khả năng đó là lừa đảo.',
    'color:#111827; font-size:14px;'
  );

  // Phát hiện DevTools đang mở (heuristic dựa trên chênh lệch kích thước cửa sổ khi
  // DevTools ghim vào cạnh trình duyệt) — CHỈ hiển thị 1 banner nhỏ có thể đóng, KHÔNG
  // khoá thao tác, KHÔNG dùng debugger loop. Bỏ qua nếu màn hình nhỏ (mobile hay false-positive).
  const DEVTOOLS_SIZE_THRESHOLD = 160;
  let devtoolsBannerShown = false;

  function showDevtoolsBanner() {
    if (devtoolsBannerShown || document.getElementById('__devtoolsNoticeBanner')) return;
    devtoolsBannerShown = true;

    const banner = document.createElement('div');
    banner.id = '__devtoolsNoticeBanner';
    banner.setAttribute('role', 'status');
    banner.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483647',
      'background:#111827', 'color:#f9fafb', 'font:13px/1.5 system-ui,sans-serif',
      'padding:10px 16px', 'display:flex', 'align-items:center', 'justify-content:space-between',
      'gap:12px', 'box-shadow:0 -2px 10px rgba(0,0,0,.25)'
    ].join(';');
    banner.innerHTML =
      '<span>🔍 Có vẻ DevTools đang mở — công cụ này chỉ để tham khảo/tự dùng, không nhằm giấu logic.</span>' +
      '<button type="button" style="background:transparent;border:1px solid #4b5563;color:#f9fafb;border-radius:6px;padding:2px 10px;cursor:pointer;flex:none;">Đóng</button>';
    banner.querySelector('button').addEventListener('click', () => banner.remove());
    document.body.appendChild(banner);
  }

  function checkDevtools() {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > DEVTOOLS_SIZE_THRESHOLD || heightDiff > DEVTOOLS_SIZE_THRESHOLD) {
      showDevtoolsBanner();
    }
  }

  // Kiểm tra định kỳ (nhẹ, không phải vòng lặp debugger) thay vì chỉ 1 lần lúc tải trang,
  // để vẫn phát hiện được nếu người dùng mở DevTools SAU khi trang đã load xong.
  setInterval(checkDevtools, 1500);
  window.addEventListener('DOMContentLoaded', checkDevtools);
})();
