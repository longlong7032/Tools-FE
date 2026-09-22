// ==========================================================================
// P0.2 — State Management tập trung.
// Trước đây UI/renderer/import/export đều đọc/sửa trực tiếp biến `deviceList`
// toàn cục (deviceList.push/find/forEach...) — không kiểm soát được nơi nào
// làm thay đổi dữ liệu. Từ nay MỌI thay đổi state phải đi qua các hàm dưới
// đây; UI/renderer chỉ được đọc qua getDevices()/getDevice(), không được
// `deviceList.push(...)` trực tiếp ở module khác.
// ==========================================================================
import { DEFAULT_COLOR_TOKENS, DEFAULT_DEVICE_KEY, TOKEN_COLOR_FIELDS } from '../config/device-specs.js';

let deviceList = [];
let colorTokens = { ...DEFAULT_COLOR_TOKENS };
let deviceTypeKey = DEFAULT_DEVICE_KEY;

// ==========================================================================
// P0.12 — Object URL / Blob Cleanup.
// blobToImage() (utils/blob.js) đã tự revoke Object URL NGAY sau khi ảnh load xong, nên
// không có Object URL nào bị "treo" chờ dọn ở đây. Cái CẦN dọn ở tầng Store là tham chiếu
// tới blob/imgElement của thiết bị bị xoá — nếu không, dù `deviceList` đã bỏ phần tử đó,
// biến cục bộ vẫn có thể giữ tham chiếu đâu đó khiến GC không thu hồi được vùng nhớ ảnh lớn.
// clearDeviceAssets() dọn tường minh 2 field này trước khi thiết bị rời khỏi deviceList.
// ==========================================================================
function clearDeviceAssets(device) {
  if (!device) return;
  device.blob = null;
  device.imgElement = null;
}

export const store = {
  // --- Devices ---
  getDevices() {
    return deviceList;
  },
  getDevice(id) {
    return deviceList.find((d) => d.id === id) || null;
  },
  addDevice(device) {
    deviceList.push(device);
    return device;
  },
  addDevices(devices) {
    deviceList.push(...devices);
    return devices;
  },
  updateDevice(id, patch) {
    const device = store.getDevice(id);
    if (device) Object.assign(device, patch);
    return device;
  },
  removeDevice(id) {
    const device = store.getDevice(id);
    clearDeviceAssets(device);
    deviceList = deviceList.filter((d) => d.id !== id);
  },
  replaceDevices(devices) {
    deviceList.forEach(clearDeviceAssets); // Import project mới -> dọn asset của project cũ
    deviceList = devices;
  },
  reset() {
    deviceList.forEach(clearDeviceAssets);
    deviceList = [];
  },

  // --- Color tokens ---
  getColorTokens() {
    return colorTokens;
  },
  setColorTokens(tokens) {
    colorTokens = tokens;
  },

  // --- Loại thiết bị đang chọn (setting chung áp dụng cho toàn bộ danh sách) ---
  getDeviceType() {
    return deviceTypeKey;
  },
  setDeviceType(key) {
    deviceTypeKey = key;
  },

  // Trả về snapshot state đầy đủ, dùng cho export JSON — nơi DUY NHẤT đọc cả 3 phần state cùng lúc
  getFullState() {
    return { devices: deviceList, colorTokens, deviceType: deviceTypeKey };
  },
};

// Trả về tên token nếu tồn tại trong bộ token hiện tại, nếu không thì lấy token đầu tiên làm dự phòng
export function getTokenKeyOrFallback(preferredName) {
  if (preferredName && Object.prototype.hasOwnProperty.call(colorTokens, preferredName)) return preferredName;
  const keys = Object.keys(colorTokens);
  return keys.length ? keys[0] : null;
}

// Đồng bộ lại màu sắc của tất cả thiết bị đang "Từ Token" mỗi khi Color Token được cập nhật/import
// Trả về thống kê các field đã phải fallback (do token key cũ không còn tồn tại) để cảnh báo người dùng
export function syncDeviceColorsWithTokens() {
  const tokenKeys = Object.keys(colorTokens);
  const fallback = tokenKeys.length ? colorTokens[tokenKeys[0]] : '#FFFFFF';
  const fallbackDeviceIds = new Set();
  let fallbackFieldCount = 0;

  deviceList.forEach((item) => {
    TOKEN_COLOR_FIELDS.forEach(({ colorField, useTokenField, keyField }) => {
      if (!item[useTokenField]) return;
      if (!item[keyField] || !(item[keyField] in colorTokens)) {
        item[keyField] = tokenKeys.length ? tokenKeys[0] : null;
        fallbackDeviceIds.add(item.id);
        fallbackFieldCount++;
      }
      item[colorField] = (item[keyField] && colorTokens[item[keyField]]) || fallback;
    });
  });

  return { deviceCount: fallbackDeviceIds.size, fieldCount: fallbackFieldCount };
}
