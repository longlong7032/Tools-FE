// ==========================================================================
// P0.11 — Escape HTML.
// UI dựng HTML động bằng template string + innerHTML (device-card.js, color-control.js).
// Nếu nhét thẳng item.title/item.desc/item.badge (hoặc tên Color Token từ JSON import —
// đều là dữ liệu KHÔNG đáng tin, kể cả khi người dùng tự tạo ra vì JSON import coi như
// nguồn ngoài) vào HTML mà không escape thì: (1) tiêu đề chứa ký tự `"` hay `<` sẽ vỡ
// layout ngay lập tức (bug thấy được), và (2) về lý thuyết có thể chèn thẻ/script lạ.
// ==========================================================================
const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}
