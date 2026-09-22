import { $ } from '../utils/dom.js';
import { generateId } from '../utils/id.js';
import { store, syncDeviceColorsWithTokens } from '../state/store.js';
import { blobToBase64, base64ToBlob, blobToImage } from '../utils/blob.js';
import { normalizeDevice } from '../models/device.js';
import { ensureFontLoaded } from '../utils/fonts.js';
import { openExportFileModal } from '../ui/export-modal.js';
import { showToast } from '../ui/toast.js';
import { buildDeviceUI } from '../ui/device-list.js';
import { renderAllDevices } from '../renderer/bridge.js';
import { updateGlobalButtonsState } from '../ui/global-buttons.js';
import { CURRENT_PROJECT_VERSION, migrateProject } from './project-migration.js';
import { validateProjectShape, isKnownDeviceType, isRestorableDevice, isValidColorTokensOrEmpty } from './project-validation.js';

// EXPORT TOÀN BỘ CẤU HÌNH & BLOB NHỊ PHÂN VỀ JSON
export async function exportProjectAsJson() {
  const devices = store.getDevices();
  if (!devices.length) {
    showToast('⚠ Chưa có dữ liệu để xuất JSON!', 'danger');
    return;
  }

  // Chuyển toàn bộ danh sách thiết bị và mã hóa BLOB thành Base64
  const serializedDevices = await Promise.all(devices.map(async (item) => {
    const base64Data = await blobToBase64(item.blob);
    return {
      id: item.id,
      imageBlobBinary: base64Data, // Lưu trữ Binary ảnh dưới dạng mã hoá Base64
      imageMimeType: item.blob.type,
      showTitle: item.showTitle,
      showDesc: item.showDesc,
      showBadge: item.showBadge,
      title: item.title,
      desc: item.desc,
      badge: item.badge,
      titlePos: item.titlePos,
      descPos: item.descPos,
      badgePos: item.badgePos,
      titleSize: item.titleSize,
      descSize: item.descSize,
      bgColor: item.bgColor,
      bgGradient: item.bgGradient,
      bgColor2: item.bgColor2,
      bgGradientAngle: item.bgGradientAngle,
      bgPattern: item.bgPattern,
      bgGlow: item.bgGlow,
      phoneColor: item.phoneColor,
      frameLayout: item.frameLayout,
      frameTilt: item.frameTilt,
      fontFamily: item.fontFamily,
      textShadow: item.textShadow,
      titleColor: item.titleColor, titleUseToken: item.titleUseToken, titleColorKey: item.titleColorKey,
      descColor: item.descColor, descUseToken: item.descUseToken, descColorKey: item.descColorKey,
      badgeBg: item.badgeBg, badgeBgUseToken: item.badgeBgUseToken, badgeBgKey: item.badgeBgKey,
      badgeColor: item.badgeColor, badgeColorUseToken: item.badgeColorUseToken, badgeColorKey: item.badgeColorKey,
    };
  }));

  const fullState = {
    version: CURRENT_PROJECT_VERSION,
    timestamp: new Date().toISOString(),
    deviceType: $('deviceTypeSelect').value,
    colorTokens: store.getColorTokens(),
    devices: serializedDevices,
  };

  const jsonString = JSON.stringify(fullState, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  openExportFileModal(blob, `app-store-state-${Date.now()}`, 'json', 'application/json', '📄 Xuất file JSON');
}

// IMPORT JSON KHÔI PHỤC TRẠNG THÁI & TÁI TẠO BLOB
// Lưu ý (P0.10): lỗi cấu trúc tổng thể -> ném lỗi, ngừng import (app.js hiện toast danger).
// Lỗi ở TỪNG device riêng lẻ -> bỏ qua đúng device đó, không làm hỏng cả lần import.
export async function importProjectFromJson(file) {
  const jsonText = await file.text();
  const parsed = JSON.parse(jsonText);

  validateProjectShape(parsed);
  const state = migrateProject(parsed);

  if (state.deviceType && isKnownDeviceType(state.deviceType)) {
    $('deviceTypeSelect').value = state.deviceType;
    store.setDeviceType(state.deviceType);
  }

  if (state.colorTokens && isValidColorTokensOrEmpty(state.colorTokens)) {
    store.setColorTokens(state.colorTokens);
    $('colorTokenJson').value = JSON.stringify(state.colorTokens, null, 2);
  }

  if (!Array.isArray(state.devices)) return;

  const rawDevices = state.devices;
  const restorableRaw = rawDevices.filter(isRestorableDevice);
  const missingDataCount = rawDevices.length - restorableRaw.length;

  const restoredOrNull = await Promise.all(restorableRaw.map(async (raw) => {
    try {
      // Khôi phục Base64 thành Blob (Binary) thực sự
      const restoredBlob = base64ToBlob(raw.imageBlobBinary, raw.imageMimeType || 'image/png');
      const restoredImgElement = await blobToImage(restoredBlob);
      // Chuẩn hoá theo schema hiện tại (P0.8): điền default cho field thiếu, bỏ field lạ —
      // giúp import JSON từ bản cũ hơn không bị vỡ layout vì thiếu field mới.
      return { ...normalizeDevice(raw), id: raw.id || generateId('dev'), blob: restoredBlob, imgElement: restoredImgElement };
    } catch (err) {
      console.error('Bỏ qua 1 thiết bị lỗi khi import (không decode được ảnh):', err);
      return null;
    }
  }));
  const restored = restoredOrNull.filter(Boolean);
  const decodeFailedCount = restorableRaw.length - restored.length;
  const totalSkipped = missingDataCount + decodeFailedCount;

  store.replaceDevices(restored);

  // Đồng bộ lại màu Token (đề phòng JSON cũ thiếu key hoặc token đã đổi giá trị)
  syncDeviceColorsWithTokens();

  // Preload sẵn các Web Font (Google Fonts) mà JSON đang phục hồi có dùng tới, TRƯỚC khi vẽ
  // Canvas lần đầu — tránh vẽ nhầm font fallback do @font-face chưa kịp tải.
  const usedFontFamilies = [...new Set(restored.map((d) => d.fontFamily).filter(Boolean))];
  await Promise.all(usedFontFamilies.map(ensureFontLoaded));

  buildDeviceUI();
  renderAllDevices();
  updateGlobalButtonsState();

  if (totalSkipped > 0) {
    showToast(`⚠ Đã khôi phục ${restored.length} thiết bị.\n${totalSkipped} thiết bị bị thiếu/lỗi dữ liệu ảnh nên đã bỏ qua.`, 'danger');
  } else {
    showToast('✅ Khôi phục toàn bộ dữ liệu từ JSON thành công!', 'success');
  }
}
