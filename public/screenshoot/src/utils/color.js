// Kiểm tra 1 chuỗi có phải mã màu hex hợp lệ (#RGB / #RGBA / #RRGGBB / #RRGGBBAA)
export function isValidHexColor(value) {
  return typeof value === 'string' && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value.trim());
}

// Kiểm tra toàn bộ object Color Token: phải là object phẳng { "Tên": "#hex" }
// Ném lỗi kèm thông điệp cụ thể nếu sai định dạng để người dùng biết cần sửa gì
export function validateColorTokens(tokens) {
  if (!tokens || typeof tokens !== 'object' || Array.isArray(tokens)) {
    throw new Error('JSON Token phải là một object dạng { "TênToken": "#RRGGBB" }.');
  }
  const keys = Object.keys(tokens);
  if (!keys.length) {
    throw new Error('Cần khai báo ít nhất 1 Color Token.');
  }
  const invalidKeys = keys.filter((k) => !isValidHexColor(tokens[k]));
  if (invalidKeys.length) {
    throw new Error(`Các Token sau không phải mã màu hex hợp lệ: ${invalidKeys.join(', ')}.`);
  }
}
