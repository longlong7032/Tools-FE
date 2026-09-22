import { DEVICE_FIELD_GROUPS } from '../models/device.js';

// Copy/Dán toàn bộ thuộc tính Tiêu đề/Mô tả/Badge, dùng CLIPBOARD THẬT của hệ điều hành
// (navigator.clipboard) — không chỉ giữ tạm trong bộ nhớ tab — để dán được sang tab/trình
// duyệt khác, hoặc gửi (dán) chuỗi JSON này cho người dùng khác trên máy khác tự dán vào
// trang của họ, không phải nhập lại nội dung từ đầu.
//
// Danh sách field lấy từ DEVICE_FIELD_GROUPS (nguồn DUY NHẤT định nghĩa schema, xem
// models/device.js) thay vì liệt kê tay, để không bị lệch khi sau này thêm/bớt field
// Tiêu đề/Mô tả/Badge. Loại bgColor/phoneColor vì đó là màu Canvas/vỏ máy — không thuộc
// nhóm Tiêu đề/Mô tả/Badge mà tính năng này nhắm tới.
const { CONTENT_FIELDS, STYLE_FIELDS } = DEVICE_FIELD_GROUPS;
const EXCLUDED_STYLE_FIELDS = new Set(['bgColor', 'bgGradient', 'bgColor2', 'bgGradientAngle', 'bgPattern', 'bgGlow', 'phoneColor', 'frameLayout', 'frameTilt']);
export const TEXT_BADGE_COPY_FIELDS = [
  ...CONTENT_FIELDS,
  ...STYLE_FIELDS.filter((f) => !EXCLUDED_STYLE_FIELDS.has(f)),
];

// Đánh dấu riêng để Dán nhận ra đúng định dạng của TOOL này — tránh áp bừa nội dung linh tinh
// (vd người dùng lỡ Copy 1 đoạn text/JSON khác) đè lên Tiêu đề/Mô tả/Badge đang có.
const PAYLOAD_TYPE = 'screenshot-tool/text-badge-style@1';

// Trình duyệt cũ/Cốc Cốc hoặc trang không chạy trên HTTPS/localhost có thể chặn
// navigator.clipboard — giữ thêm 1 bản trong bộ nhớ tab làm phương án dự phòng, để Copy/Dán
// TRONG CÙNG TAB vẫn hoạt động dù không ghi được ra clipboard hệ thống.
let memoryFallback = null;

function buildPayload(item) {
  const fields = {};
  for (const field of TEXT_BADGE_COPY_FIELDS) fields[field] = item[field];
  return { __type: PAYLOAD_TYPE, fields };
}

// Trả về { ok, viaSystemClipboard } — luôn ok:true trừ khi item không hợp lệ, vì luôn còn
// phương án dự phòng trong bộ nhớ tab.
export async function copyTextBadgeStyle(item) {
  const payload = buildPayload(item);
  memoryFallback = payload;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload));
      return { ok: true, viaSystemClipboard: true };
    } catch (err) {
      console.warn('[style-clipboard] Không ghi được vào Clipboard hệ thống, dùng bộ nhớ tạm:', err);
    }
  }
  return { ok: true, viaSystemClipboard: false };
}

// Đọc Clipboard hệ thống tại THỜI ĐIỂM BẤM Dán (không cache), để nhận đúng nội dung mới nhất
// — kể cả khi nội dung đó do CHÍNH TAB NÀY copy trước đó, do TAB KHÁC của cùng trình duyệt,
// hay do người dùng dán tay 1 chuỗi JSON nhận từ người khác gửi qua chat/email.
export async function pasteTextBadgeStyle(item) {
  let payload = null;

  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = JSON.parse(text);
      if (parsed && parsed.__type === PAYLOAD_TYPE && parsed.fields) payload = parsed;
    } catch (err) {
      // Clipboard trống/không phải JSON hợp lệ/bị chặn quyền đọc -> rơi xuống bản dự phòng bên dưới
    }
  }

  if (!payload) payload = memoryFallback;
  if (!payload) return { ok: false, reason: 'empty' };

  for (const field of TEXT_BADGE_COPY_FIELDS) {
    if (field in payload.fields) item[field] = payload.fields[field];
  }
  return { ok: true };
}
