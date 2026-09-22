// ==========================================================================
// P0.9 — Project Version + Migration.
// Hiện tại mới chỉ có version "1.0" nên chưa có bước migrate thật sự nào cần chạy — nhưng
// hạ tầng đã sẵn sàng: mỗi khi đổi cấu trúc project.json (vd thêm field bắt buộc, đổi tên
// field...), chỉ cần thêm 1 entry vào MIGRATIONS bên dưới, KHÔNG cần sửa chỗ khác.
// ==========================================================================
export const CURRENT_PROJECT_VERSION = '1.0';

// key: version NGUỒN, value: hàm biến đổi state ở version đó sang version KẾ TIẾP.
// Ví dụ khi cần thêm (giả định) nâng cấp lên "1.1":
//   const MIGRATIONS = { '1.0': (state) => ({ ...state, version: '1.1', ... }) };
const MIGRATIONS = {
  // (chưa có bước nào — chỉ mới có version "1.0")
};

// Chạy tuần tự các bước migrate từ version của `state` cho tới CURRENT_PROJECT_VERSION.
// Project không có `version` (file rất cũ) được coi như "1.0". Không throw nếu không có
// bước migrate nào áp dụng được — chỉ đơn giản trả nguyên state (đã là bản mới nhất).
export function migrateProject(state) {
  let current = { ...state, version: state.version || '1.0' };
  let guard = 0; // chặn vòng lặp vô hạn nếu lỡ cấu hình MIGRATIONS thành chu trình
  while (current.version !== CURRENT_PROJECT_VERSION && MIGRATIONS[current.version] && guard < 20) {
    current = MIGRATIONS[current.version](current);
    guard += 1;
  }
  return current;
}
