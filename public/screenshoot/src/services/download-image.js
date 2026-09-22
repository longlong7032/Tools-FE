import { $ } from '../utils/dom.js';
import { DEVICE_SPECS } from '../config/device-specs.js';
import { openExportFileModal } from '../ui/export-modal.js';

// Xuất PNG của riêng 1 thiết bị — mở modal đặt tên + chọn Tải về máy / Chia sẻ (giống Export ZIP/JSON).
export function downloadDeviceImage(item, deviceTypeKey) {
  const spec = DEVICE_SPECS[deviceTypeKey] || DEVICE_SPECS['android-phone'];
  const srcCanvas = $(`canvas_${item.id}`);
  if (!srcCanvas) return;

  srcCanvas.toBlob((blob) => {
    openExportFileModal(blob, `store-${deviceTypeKey}-${spec.width}x${spec.height}-${Date.now()}`, 'png', 'image/png', '🖼 Xuất ảnh');
  }, 'image/png');
}
