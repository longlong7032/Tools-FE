import { $ } from '../utils/dom.js';
import { DEVICE_GROUPS, DEVICE_SPECS, DEFAULT_DEVICE_KEY } from '../config/device-specs.js';

// Sinh options <select> Loại thiết bị TỰ ĐỘNG từ DEVICE_SPECS/DEVICE_GROUPS, nên sau này chỉ
// cần sửa config/device-specs.js (thêm/bớt/đổi key) là UI tự cập nhật theo, không cần sửa
// tay HTML nữa (tránh lệch giữa DEVICE_SPECS và <select> như từng xảy ra trước đây).
export function populateDeviceTypeSelect() {
  const select = $('deviceTypeSelect');
  select.innerHTML = DEVICE_GROUPS.map((group) => {
    const options = group.keys
      .filter((key) => DEVICE_SPECS[key])
      .map((key) => {
        const spec = DEVICE_SPECS[key];
        const selected = key === DEFAULT_DEVICE_KEY ? ' selected' : '';
        return `<option value="${key}"${selected}>${spec.name} (${spec.width} × ${spec.height})</option>`;
      }).join('');
    return `<optgroup label="${group.label}">${options}</optgroup>`;
  }).join('');
}
