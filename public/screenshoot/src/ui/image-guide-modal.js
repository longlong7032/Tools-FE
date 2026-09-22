import { $ } from '../utils/dom.js';
import { DEVICE_SPECS, DEVICE_GROUPS, FRAME_CONFIGS, DESKTOP_DEVICE_KEYS } from '../config/device-specs.js';
import { computeGeometry } from '../renderer/geometry.js';
import { computeScreenRect } from '../renderer/phone-tablet-frame.js';
import { computeDesktopScreenRect } from '../renderer/desktop.js';

// Ảnh luôn được vẽ theo kiểu "cover" (lấp đầy, không méo hình — xem phone-tablet-frame.js/
// desktop.js), nên phần dư ra ngoài do lệch tỉ lệ sẽ bị crop. Kích cỡ canvas xuất ra (vd
// 2048x2732) KHÔNG phải là kích cỡ vùng ảnh thật — vùng đó nhỏ hơn do phải chừa chỗ cho viền
// máy/tai thỏ/tiêu đề. Modal này tính tỉ lệ vùng ảnh thật NGAY TỪ chính công thức renderer
// dùng để vẽ (không hard-code số), nên luôn khớp với những gì người dùng thấy trên preview.
function computeScreenSize(key) {
  const spec = DEVICE_SPECS[key];
  const geometry = computeGeometry({ showTitle: false, showDesc: false }, spec.width, spec.height);
  const screen = DESKTOP_DEVICE_KEYS.has(key)
    ? computeDesktopScreenRect(geometry, key === 'mac-desktop')
    : computeScreenRect(geometry, FRAME_CONFIGS[key]);
  return { canvasW: spec.width, canvasH: spec.height, screenW: Math.round(screen.w), screenH: Math.round(screen.h) };
}

function formatRatio(w, h) {
  const r = w / h;
  return r < 1 ? `1 : ${(1 / r).toFixed(2)}` : `${r.toFixed(2)} : 1`;
}

function buildGuideRows() {
  return DEVICE_GROUPS.map((group) => {
    const rows = group.keys
      .filter((key) => DEVICE_SPECS[key])
      .map((key) => {
        const spec = DEVICE_SPECS[key];
        const { screenW, screenH } = computeScreenSize(key);
        return `
          <tr>
            <td>${spec.name}</td>
            <td class="text-nowrap">${spec.width} × ${spec.height}</td>
            <td class="text-nowrap fw-semibold text-primary">${formatRatio(screenW, screenH)}</td>
          </tr>`;
      })
      .join('');
    return `
      <tr class="table-secondary"><td colspan="3" class="small fw-bold">${group.label}</td></tr>
      ${rows}`;
  }).join('');
}

export function initImageGuideModal() {
  const btn = $('imageGuideBtn');
  if (!btn) return;

  let modalInstance = null;
  btn.addEventListener('click', () => {
    $('imageGuideTableBody').innerHTML = buildGuideRows();
    if (!modalInstance) modalInstance = new bootstrap.Modal($('imageGuideModal'));
    modalInstance.show();
  });
}
