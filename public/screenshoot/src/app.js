// Entry point — nơi DUY NHẤT gắn sự kiện cho các control ở panel bên trái (upload ảnh,
// export/import JSON, token, nút toàn cục...). Mọi logic thật sự nằm ở state/renderer/ui/services;
// file này chỉ "lắp ráp" chúng lại với nhau.
import { $ } from './utils/dom.js';
import { store, getTokenKeyOrFallback, syncDeviceColorsWithTokens } from './state/store.js';
import { createDevice } from './models/device.js';
import { DEVICE_SPECS, DEFAULT_DEVICE_KEY, TEXT_POSITIONS, BADGE_POSITIONS } from './config/device-specs.js';
import { generateId } from './utils/id.js';
import { getDistinctRandomPositions } from './utils/random.js';
import { validateColorTokens } from './utils/color.js';
import { blobToImage } from './utils/blob.js';

import { populateDeviceTypeSelect } from './ui/device-type-select.js';
import { initThemeToggle } from './ui/theme.js';
import { buildDeviceUI, bindDeviceListEvents } from './ui/device-list.js';
import { updateGlobalButtonsState } from './ui/global-buttons.js';
import { initExportModal } from './ui/export-modal.js';
import { initImageGuideModal } from './ui/image-guide-modal.js';
import { showToast } from './ui/toast.js';

import { renderAllDevices } from './renderer/bridge.js';
import { exportProjectAsJson, importProjectFromJson } from './services/project-json.js';
import { exportAllAsZip } from './services/zip-export.js';

populateDeviceTypeSelect();
store.setDeviceType($('deviceTypeSelect').value);
initThemeToggle();
bindDeviceListEvents();
initExportModal();
initImageGuideModal();

// SỰ KIỆN TẢI FILE ẢNH -> TẠO BLOB BINARY
// Lưu ý: ảnh mới được NỐI THÊM vào danh sách hiện có (không xoá ảnh đã tải trước đó),
// để thêm ảnh giữa chừng không cần chọn lại từ đầu toàn bộ ảnh cũ.
$('multiImageInput').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length) return;

  const titleKey = getTokenKeyOrFallback('TextLight');
  const descKey = getTokenKeyOrFallback('TextMuted');
  const badgeBgKey = getTokenKeyOrFallback('PrimaryBlue');
  const badgeColorKey = getTokenKeyOrFallback('TextLight');
  const colorTokens = store.getColorTokens();
  const startIndex = store.getDevices().length; // Nối tiếp số thứ tự thay vì reset về #1

  // Cỡ chữ mặc định (64/36) được tinh chỉnh gốc theo canvas rộng 1080px (Android Phone).
  // Co theo bề rộng thiết bị đang chọn để ảnh mới thêm vào không bị chữ quá nhỏ trên canvas
  // Desktop rộng gấp 2-3 lần, hoặc quá to trên canvas nhỏ như Microsoft Store Base.
  const currentSpec = DEVICE_SPECS[store.getDeviceType()] || DEVICE_SPECS[DEFAULT_DEVICE_KEY];
  const defaultSizeScale = currentSpec.width / 1080;
  const defaultTitleSize = Math.round(64 * defaultSizeScale);
  const defaultDescSize = Math.round(36 * defaultSizeScale);

  const newDevices = [];
  for (let i = 0; i < files.length; i++) {
    const rawFile = files[i];
    const index = startIndex + i;

    // Đọc File trực tiếp thành Blob (Binary)
    const imageBlob = new Blob([await rawFile.arrayBuffer()], { type: rawFile.type });
    const imageElement = await blobToImage(imageBlob);
    const { titlePos, descPos, badgePos } = getDistinctRandomPositions(TEXT_POSITIONS, BADGE_POSITIONS);

    newDevices.push(createDevice({
      id: generateId('dev'),
      blob: imageBlob,          // Dữ liệu ảnh dạng BLOB nhị phân
      imgElement: imageElement, // Element dùng để render lên Canvas
      title: `Tính năng sản phẩm #${index + 1}`,
      desc: 'Mô tả tính năng trực quan hiển thị trên thiết bị di động.',
      titlePos,
      descPos,
      badgePos,
      titleSize: defaultTitleSize,
      descSize: defaultDescSize,
      titleColor: colorTokens[titleKey] || '#FFFFFF', titleUseToken: true, titleColorKey: titleKey,
      descColor: colorTokens[descKey] || '#FFFFFF', descUseToken: true, descColorKey: descKey,
      badgeBg: colorTokens[badgeBgKey] || '#3B82F6', badgeBgUseToken: true, badgeBgKey: badgeBgKey,
      badgeColor: colorTokens[badgeColorKey] || '#FFFFFF', badgeColorUseToken: true, badgeColorKey: badgeColorKey,
    }));
  }

  store.addDevices(newDevices);
  buildDeviceUI();
  requestAnimationFrame(() => {
    renderAllDevices();
    updateGlobalButtonsState();
  });
  e.target.value = ''; // Cho phép chọn lại đúng file này ở lần sau nếu cần
});

// EXPORT JSON
$('exportJsonBtn').addEventListener('click', () => {
  exportProjectAsJson();
});

// IMPORT JSON
$('importJsonTriggerBtn').addEventListener('click', () => $('importJsonInput').click());

$('importJsonInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    await importProjectFromJson(file);
  } catch (err) {
    console.error(err);
    // P0.10: SyntaxError (từ JSON.parse) có message kỹ thuật khó hiểu -> dùng câu chung.
    // Lỗi validate cấu trúc (validateProjectShape) đã có message rõ ràng -> hiện thẳng cho người dùng biết cần sửa gì.
    const message = err instanceof SyntaxError
      ? '❌ File JSON không đúng định dạng hoặc bị hỏng!'
      : '❌ ' + (err.message || 'File JSON không đúng định dạng hoặc bị hỏng!');
    showToast(message, 'danger');
  } finally {
    e.target.value = '';
  }
});

// COLOR TOKEN
$('applyTokenBtn').addEventListener('click', () => {
  const raw = $('colorTokenJson').value.trim();
  if (!raw) return;

  let newTokens;
  try {
    newTokens = JSON.parse(raw);
  } catch (e) {
    showToast('❌ Chuỗi JSON Token không hợp lệ (sai cú pháp JSON)!', 'danger');
    return;
  }

  try {
    validateColorTokens(newTokens);
  } catch (e) {
    showToast('❌ ' + e.message, 'danger');
    return;
  }

  store.setColorTokens(newTokens);
  const { deviceCount, fieldCount } = syncDeviceColorsWithTokens();
  buildDeviceUI();
  renderAllDevices();

  // Auto-format lại ô nhập cho gọn gàng, dễ soát lỗi ở lần sửa tiếp theo
  $('colorTokenJson').value = JSON.stringify(newTokens, null, 2);

  if (fieldCount > 0) {
    showToast(`⚠ Đã cập nhật Token thành công.\n${fieldCount} màu (trên ${deviceCount} thiết bị) dùng Token đã bị xoá, đã tự chuyển sang Token khác — kiểm tra lại preview.`, 'success');
  } else {
    showToast('✅ Đã cập nhật Color Tokens thành công!', 'success');
  }
});

// ĐỔI LOẠI THIẾT BỊ
$('deviceTypeSelect').addEventListener('change', (e) => {
  store.setDeviceType(e.target.value);
  renderAllDevices();
});

// RANDOM VỊ TRÍ TẤT CẢ
$('randomAllPositionsBtn').addEventListener('click', () => {
  store.getDevices().forEach((item) => {
    const { titlePos, descPos, badgePos } = getDistinctRandomPositions(TEXT_POSITIONS, BADGE_POSITIONS);
    item.titlePos = titlePos;
    item.descPos = descPos;
    item.badgePos = badgePos;
  });
  buildDeviceUI();
  renderAllDevices();
});

// XUẤT TOÀN BỘ RA ZIP
$('exportAllBtn').addEventListener('click', async () => {
  if (!store.getDevices().length) return;

  const btn = $('exportAllBtn');
  const spinner = $('exportBtnSpinner');
  const btnText = $('exportBtnText');

  btn.disabled = true;
  spinner.classList.remove('d-none');
  btnText.innerText = 'Đang nén ZIP...';

  try {
    await exportAllAsZip();
  } catch (err) {
    showToast('❌ Có lỗi xảy ra khi đóng gói ZIP!', 'danger');
    console.error(err);
  } finally {
    btn.disabled = false;
    spinner.classList.add('d-none');
    btnText.innerText = '⬇ Tải toàn bộ xuống (ZIP File)';
  }
});

// XOÁ TẤT CẢ & LÀM LẠI
$('resetAllBtn').addEventListener('click', () => {
  if (!store.getDevices().length) return;
  if (!confirm('Xoá toàn bộ danh sách thiết bị và làm lại từ đầu? Không thể hoàn tác.')) return;
  store.reset();
  $('multiImageInput').value = '';
  buildDeviceUI();
  updateGlobalButtonsState();
});
