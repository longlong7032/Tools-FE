// ==========================================================================
// P0.10 — Validate Import.
// JSON import là dữ liệu bên ngoài ứng dụng, không nên giả định luôn đúng schema.
// Nguyên tắc: lỗi CẤU TRÚC tổng thể (không phải object, devices không phải mảng...) thì
// NGỪNG import ngay và báo lỗi rõ ràng; còn lỗi ở TỪNG device riêng lẻ (thiếu dữ liệu ảnh,
// decode lỗi...) thì BỎ QUA đúng device đó thay vì làm hỏng luôn cả lần import — 1 ảnh lỗi
// không nên khiến người dùng mất hết các ảnh còn lại trong file.
// ==========================================================================
import { DEVICE_SPECS } from '../config/device-specs.js';
import { validateColorTokens } from '../utils/color.js';

// Kiểm tra hình dạng tổng quát của state — ném lỗi RÕ RÀNG nếu cấu trúc sai hẳn.
export function validateProjectShape(state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    throw new Error('File JSON không đúng định dạng (không phải một object).');
  }
  if (state.devices !== undefined && !Array.isArray(state.devices)) {
    throw new Error('Trường "devices" trong file JSON phải là một danh sách.');
  }
  if (state.colorTokens !== undefined && (typeof state.colorTokens !== 'object' || Array.isArray(state.colorTokens) || state.colorTokens === null)) {
    throw new Error('Trường "colorTokens" trong file JSON không hợp lệ.');
  }
}

export function isKnownDeviceType(key) {
  return typeof key === 'string' && key in DEVICE_SPECS;
}

// 1 device thô (chưa restore blob) có đủ dữ liệu tối thiểu để phục hồi hay không.
export function isRestorableDevice(raw) {
  return !!(raw && typeof raw === 'object' && typeof raw.imageBlobBinary === 'string' && raw.imageBlobBinary.length > 0);
}

// Không throw — chỉ trả true/false, để import vẫn tiếp tục được với token mặc định
// thay vì hỏng cả project chỉ vì phần colorTokens bị lỗi.
export function isValidColorTokensOrEmpty(tokens) {
  if (tokens === undefined) return true;
  try {
    validateColorTokens(tokens);
    return true;
  } catch {
    return false;
  }
}
