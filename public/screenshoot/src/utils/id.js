let counter = 0;

// ID duy nhất trong phiên làm việc — Date.now() + counter tăng dần để tránh trùng
// khi tạo nhiều device liên tiếp trong cùng 1ms (Date.now() một mình không đủ phân giải).
export function generateId(prefix = 'dev') {
  counter += 1;
  return `${prefix}_${Date.now()}_${counter}`;
}
