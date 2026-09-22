import { $ } from '../utils/dom.js';
import { store } from '../state/store.js';
import { DEVICE_SPECS } from '../config/device-specs.js';
import { openExportFileModal } from '../ui/export-modal.js';

// Nén toàn bộ Canvas hiện có thành 1 file ZIP, rồi mở modal đặt tên/chọn Tải về máy/Chia sẻ.
// Không tự quản lý trạng thái nút bấm (spinner/disabled) — nơi gọi (app.js) lo phần đó,
// service này chỉ lo đúng 1 việc: tạo ZIP.
export async function exportAllAsZip() {
  const devices = store.getDevices();
  if (!devices.length) return;

  const zip = new JSZip();
  const deviceTypeKey = store.getDeviceType();
  const spec = DEVICE_SPECS[deviceTypeKey] || DEVICE_SPECS['android-phone'];

  for (let index = 0; index < devices.length; index++) {
    const item = devices[index];
    const srcCanvas = $(`canvas_${item.id}`);
    if (!srcCanvas) continue;

    // Chuyển Canvas thành Blob binary
    const canvasBlob = await new Promise((resolve) => srcCanvas.toBlob(resolve, 'image/png'));
    const fileName = `screenshot_${index + 1}_${deviceTypeKey}_${spec.width}x${spec.height}.png`;
    zip.file(fileName, canvasBlob);
  }

  const zipContent = await zip.generateAsync({ type: 'blob' });
  openExportFileModal(zipContent, `store-screenshots-${deviceTypeKey}-${Date.now()}`, 'zip', 'application/zip', '📦 Xuất file ZIP');
}
