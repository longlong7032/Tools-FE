import { store } from '../state/store.js';
import { escapeHtml } from '../utils/html.js';

// Sinh HTML cho 1 ô chọn màu (dùng cho Màu chữ Tiêu đề/Mô tả, Nền/Chữ Badge) — có thể ở
// chế độ "Từ Token" (select liệt kê Color Token hiện có) hoặc "Tự chọn" (input type=color).
export function renderColorControlHtml(itemId, fieldKey, labelText, currentValue, useToken, currentKey) {
  const colorTokens = store.getColorTokens();
  const tokenKeys = Object.keys(colorTokens);
  // Ưu tiên khớp theo tên Token (currentKey); nếu không có (dữ liệu JSON cũ) thì khớp tạm theo mã màu.
  // P0.11 — tên Token (k) đến từ colorTokens do người dùng Import JSON, coi như nguồn ngoài
  // không đáng tin -> escape trước khi nhét vào HTML (hex đã được validateColorTokens() ràng
  // buộc đúng định dạng #RRGGBB từ trước nên an toàn, không bắt buộc escape nhưng vẫn escape
  // currentValue cho chắc vì nó đi qua nhiều bước biến đổi hơn).
  const tokenOptions = tokenKeys.map((k) => {
    const hex = colorTokens[k];
    const safeKey = escapeHtml(k);
    const isSelected = currentKey ? (k === currentKey) : (hex.toLowerCase() === String(currentValue).toLowerCase());
    return `<option value="${hex}" data-key="${safeKey}" ${isSelected ? 'selected' : ''}>${safeKey} (${hex})</option>`;
  }).join('');
  const safeCurrentValue = escapeHtml(currentValue);

  return `
    <label class="form-label small mb-1 fw-semibold">${labelText}</label>
    <div class="input-group input-group-sm">
      ${useToken ? `
        <select class="form-select ctrl-color-token" data-id="${itemId}" data-field="${fieldKey}">
          ${tokenOptions || '<option value="#FFFFFF">Default (#FFFFFF)</option>'}
        </select>
      ` : `
        <input type="color" class="form-control form-control-color ctrl-color-custom" data-id="${itemId}" data-field="${fieldKey}" value="${safeCurrentValue}">
      `}
      <button type="button" class="btn btn-outline-secondary ctrl-toggle-colormode" data-id="${itemId}" data-field="${fieldKey}" title="${useToken ? 'Chuyển sang tự chọn màu' : 'Chuyển sang dùng Color Token'}">
        ${useToken ? '🎨' : '🏷'}
      </button>
    </div>
  `;
}
