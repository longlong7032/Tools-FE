// Bỏ ký tự không hợp lệ trong tên file & khoảng trắng thừa
export function sanitizeFileName(name) {
  const cleaned = String(name).trim().replace(/[\\/:*?"<>|]+/g, '-');
  return cleaned || 'export';
}
