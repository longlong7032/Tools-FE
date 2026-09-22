// ==========================================================================
// P0.5 — Event Delegation.
// Trước đây mỗi lần buildDeviceUI()/render lại 1 card là gọi lại bindDeviceEvents(),
// gắn listener MỚI lên từng input/select/button — vì DOM cũ đã bị innerHTML='' xoá nên
// listener cũ "chết" theo (không leak), NHƯNG có 1 trường hợp thật sự bind trùng: toggle
// đổi màu (🎨/🏷) chỉ thay innerHTML của 1 <div> nhỏ rồi gọi lại bindDeviceEvents() cho
// CẢ TRANG — các input/button khác (không đổi DOM) bị gắn thêm 1 listener chồng lên listener
// cũ đã có, cứ mỗi lần đổi màu 1 item là toàn bộ item khác bị nhân đôi số listener.
//
// Cách sửa: gắn 3 listener DUY NHẤT (input/change/click) lên #deviceContainer MỘT LẦN,
// dùng event.target.closest(selector) để xác định đúng control — dù DOM bên trong render
// lại bao nhiêu lần, số lượng listener luôn là 3, không tăng.
// ==========================================================================
import { $ } from '../utils/dom.js';
import { store, getTokenKeyOrFallback } from '../state/store.js';
import { TEXT_POSITIONS, BADGE_POSITIONS, TOKEN_COLOR_FIELDS, THEME_PRESETS, CANVAS_STYLE_FIELDS } from '../config/device-specs.js';
import { getDistinctRandomPositions } from '../utils/random.js';
import { renderColorControlHtml } from './color-control.js';
import { ensureFontLoaded } from '../utils/fonts.js';
import { buildDeviceCardHtml, emptyStateHtml } from './device-card.js';
import { updateGlobalButtonsState } from './global-buttons.js';
import { renderDeviceById, renderAllDevices } from '../renderer/bridge.js';
import { downloadDeviceImage } from '../services/download-image.js';
import { copyTextBadgeStyle, pasteTextBadgeStyle } from './style-clipboard.js';
import { blobToImage } from '../utils/blob.js';
import { showToast } from './toast.js';

export function buildDeviceUI() {
  const container = $('deviceContainer');
  const devices = store.getDevices();
  container.innerHTML = '';

  if (!devices.length) {
    container.innerHTML = emptyStateHtml();
    return;
  }

  devices.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'accordion-item border-0 rounded-4 shadow-sm overflow-hidden';
    card.innerHTML = buildDeviceCardHtml(item, idx);
    container.appendChild(card);
  });
}

function rebuildAndRenderAll() {
  buildDeviceUI();
  renderAllDevices();
}

// --- input: gõ text/số, chọn màu ---
function handleInput(e) {
  const target = e.target;

  const tokenSelect = target.closest('.ctrl-color-token');
  if (tokenSelect) {
    const item = store.getDevice(tokenSelect.dataset.id);
    if (item) {
      const field = tokenSelect.dataset.field;
      const opt = tokenSelect.selectedOptions[0];
      item[field] = tokenSelect.value;
      item[field + 'Key'] = opt ? opt.dataset.key : null;
      renderDeviceById(item.id);
    }
    return;
  }

  const customColor = target.closest('.ctrl-color-custom');
  if (customColor) {
    updateItemField(customColor, customColor.dataset.field);
    return;
  }

  if (target.closest('.ctrl-color-bg')) { updateItemField(target, 'bgColor'); return; }
  if (target.closest('.ctrl-color-bg2')) { updateItemField(target, 'bgColor2'); return; }
  if (target.closest('.ctrl-color-phone')) { updateItemField(target, 'phoneColor'); return; }

  if (target.closest('.ctrl-title')) { updateItemField(target, 'title'); return; }
  if (target.closest('.ctrl-title-size')) { updateItemField(target, 'titleSize', true); return; }
  if (target.closest('.ctrl-desc')) { updateItemField(target, 'desc'); return; }
  if (target.closest('.ctrl-desc-size')) { updateItemField(target, 'descSize', true); return; }
  if (target.closest('.ctrl-badge')) { updateItemField(target, 'badge'); return; }
  if (target.closest('.ctrl-frame-tilt')) { updateItemField(target, 'frameTilt', true); return; }
}

function updateItemField(el, key, isNumber = false) {
  const item = store.getDevice(el.dataset.id);
  if (!item) return;
  item[key] = isNumber ? (+el.value || 0) : el.value;
  renderDeviceById(item.id);
}

function updateCheckboxField(el, key) {
  const item = store.getDevice(el.dataset.id);
  if (!item) return;
  item[key] = el.checked;
  renderDeviceById(item.id);
}

// Đổi Font: vẽ ngay với font fallback (phản hồi tức thì), rồi vẽ lại lần nữa khi Web Font
// (Google Fonts) tải xong — Canvas không tự vẽ lại khi font tải xong như DOM nên phải chủ động.
function handleFontChange(select) {
  const item = store.getDevice(select.dataset.id);
  if (!item) return;
  item.fontFamily = select.value;
  renderDeviceById(item.id);
  ensureFontLoaded(select.value).then(() => renderDeviceById(item.id));
}

// Đổi Kiểu khung (thẳng/nghiêng/tràn viền): chỉ hiện ô "Góc nghiêng" khi chọn Nghiêng —
// vá tay hiển thị của riêng ô này thay vì rebuild cả card, giống pattern toggleGroup().
function handleFrameLayoutChange(select) {
  const item = store.getDevice(select.dataset.id);
  if (!item) return;
  item.frameLayout = select.value;
  const group = select.closest('.accordion-body').querySelector('.ctrl-frame-tilt-group');
  if (group) group.classList.toggle('d-none', select.value !== 'tilted');
  renderDeviceById(item.id);
}

// --- change: đổi vị trí, bật/tắt hiển thị ---
function handleChange(e) {
  const target = e.target;

  if (target.closest('.ctrl-title-pos')) { updateItemField(target, 'titlePos'); return; }
  if (target.closest('.ctrl-desc-pos')) { updateItemField(target, 'descPos'); return; }
  if (target.closest('.ctrl-badge-pos')) { updateItemField(target, 'badgePos'); return; }
  if (target.closest('.ctrl-bg-gradient-angle')) { updateItemField(target, 'bgGradientAngle', true); return; }
  if (target.closest('.ctrl-bg-pattern')) { updateItemField(target, 'bgPattern'); return; }
  if (target.closest('.ctrl-font-family')) { handleFontChange(target); return; }
  if (target.closest('.ctrl-frame-layout')) { handleFrameLayoutChange(target); return; }

  if (target.closest('.ctrl-toggle-title')) { toggleGroup(target, 'showTitle', 'ctrl-title-group'); return; }
  if (target.closest('.ctrl-toggle-desc')) { toggleGroup(target, 'showDesc', 'ctrl-desc-group'); return; }
  if (target.closest('.ctrl-toggle-badge')) { toggleGroup(target, 'showBadge', 'ctrl-badge-group'); return; }
  if (target.closest('.ctrl-toggle-bg-gradient')) { toggleGroup(target, 'bgGradient', 'ctrl-bg-gradient-group'); return; }
  if (target.closest('.ctrl-toggle-text-shadow')) { updateCheckboxField(target, 'textShadow'); return; }
  if (target.closest('.ctrl-toggle-bg-glow')) { updateCheckboxField(target, 'bgGlow'); return; }

  const changeImageInput = target.closest('.ctrl-change-image-input');
  if (changeImageInput) { handleChangeImage(changeImageInput); return; }
}

// --- đổi ảnh: giữ nguyên toàn bộ Tiêu đề/Mô tả/Badge/vị trí, chỉ thay blob + imgElement ---
async function handleChangeImage(input) {
  const file = input.files[0];
  const item = store.getDevice(input.dataset.id);
  if (!file || !item) { input.value = ''; return; }

  try {
    const imageBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    const imageElement = await blobToImage(imageBlob);
    item.blob = imageBlob;
    item.imgElement = imageElement;
    renderDeviceById(item.id);
    const idx = store.getDevices().findIndex((d) => d.id === item.id);
    showToast(`🖼 Đã đổi ảnh cho Thiết bị #${idx + 1}`, 'success');
  } catch (err) {
    console.error(err);
    showToast('❌ Không đọc được ảnh này — hãy thử file PNG/JPEG/WEBP khác.', 'danger');
  } finally {
    input.value = ''; // Cho phép chọn lại đúng file này ở lần sau nếu cần
  }
}

function toggleGroup(checkbox, key, className) {
  const item = store.getDevice(checkbox.dataset.id);
  if (!item) return;
  item[key] = checkbox.checked;
  const group = checkbox.closest('.accordion-body').querySelector('.' + className);
  if (group) group.classList.toggle('d-none', !checkbox.checked);
  renderDeviceById(item.id);
}

// --- click: nút toggle màu, random vị trí, xuất/xoá ảnh ---
function handleClick(e) {
  const copyStyleBtn = e.target.closest('.btn-copy-style');
  if (copyStyleBtn) { handleCopyStyle(copyStyleBtn); return; }

  const pasteStyleBtn = e.target.closest('.btn-paste-style');
  if (pasteStyleBtn) { handlePasteStyle(pasteStyleBtn); return; }

  const changeImageBtn = e.target.closest('.btn-change-image');
  if (changeImageBtn) {
    const input = document.querySelector(`.ctrl-change-image-input[data-id="${changeImageBtn.dataset.id}"]`);
    if (input) input.click();
    return;
  }

  const colorModeBtn = e.target.closest('.ctrl-toggle-colormode');
  if (colorModeBtn) { handleColorModeToggle(colorModeBtn); return; }

  const gradientPresetBtn = e.target.closest('.ctrl-gradient-preset');
  if (gradientPresetBtn) { handleGradientPreset(gradientPresetBtn); return; }

  const themePresetBtn = e.target.closest('.ctrl-theme-preset');
  if (themePresetBtn) { handleThemePreset(themePresetBtn); return; }

  const applyStyleAllBtn = e.target.closest('.btn-apply-style-all');
  if (applyStyleAllBtn) { handleApplyStyleToAll(applyStyleAllBtn); return; }

  const randomBtn = e.target.closest('.btn-random-single-pos');
  if (randomBtn) { handleRandomSinglePos(randomBtn); return; }

  const downloadBtn = e.target.closest('.download-single-btn');
  if (downloadBtn) {
    const item = store.getDevice(downloadBtn.dataset.id);
    if (item) downloadDeviceImage(item, store.getDeviceType());
    return;
  }

  const deleteBtn = e.target.closest('.btn-delete-single');
  if (deleteBtn) { handleDeleteSingle(deleteBtn); return; }
}

function handleColorModeToggle(btn) {
  const id = btn.dataset.id;
  const field = btn.dataset.field;
  const item = store.getDevice(id);
  // Dùng lại bảng ánh xạ TOKEN_COLOR_FIELDS để suy ra đúng tên field UseToken/Key
  // (không nối chuỗi thủ công vì tên field màu và tên cờ UseToken không phải lúc nào cũng trùng mẫu, ví dụ titleColor -> titleUseToken)
  const fieldConfig = TOKEN_COLOR_FIELDS.find((f) => f.colorField === field);
  if (!item || !fieldConfig) return;

  const modeKey = fieldConfig.useTokenField;
  const keyField = fieldConfig.keyField;
  item[modeKey] = !item[modeKey];
  if (item[modeKey]) {
    // Chuyển sang chế độ Token: cố gắng khớp màu hiện tại với 1 Token, nếu không thì lấy Token đầu tiên
    const colorTokens = store.getColorTokens();
    const tokenKeys = Object.keys(colorTokens);
    const matchedKey = tokenKeys.find((k) => colorTokens[k].toLowerCase() === String(item[field]).toLowerCase());
    item[keyField] = matchedKey || (tokenKeys.length ? tokenKeys[0] : null);
    if (item[keyField]) item[field] = colorTokens[item[keyField]];
  }

  const wrap = $(`ctrl_wrap_${id}_${field}`);
  if (wrap) {
    const label = wrap.dataset.label || 'Màu';
    // Chỉ thay nội dung của riêng ô này — KHÔNG cần gọi lại hàm gắn listener nào cả, vì
    // input/select/button mới sinh ra vẫn được bắt bởi 3 listener delegation trên container.
    wrap.innerHTML = renderColorControlHtml(id, field, label, item[field], item[modeKey], item[keyField]);
  }
  renderDeviceById(item.id);
}

// Click 1 preset gradient dựng sẵn: cập nhật state + đồng bộ luôn giá trị hiển thị của 2 ô
// màu và select hướng (các input này KHÔNG re-render qua buildDeviceUI() nên phải set tay).
function handleGradientPreset(btn) {
  const item = store.getDevice(btn.dataset.id);
  if (!item) return;
  item.bgColor = btn.dataset.from;
  item.bgColor2 = btn.dataset.to;
  item.bgGradientAngle = Number(btn.dataset.angle);

  const panel = $(`bgPanel_${item.id}`);
  if (panel) {
    const bg1 = panel.querySelector('.ctrl-color-bg');
    const bg2 = panel.querySelector('.ctrl-color-bg2');
    const angleSel = panel.querySelector('.ctrl-bg-gradient-angle');
    if (bg1) bg1.value = item.bgColor;
    if (bg2) bg2.value = item.bgColor2;
    if (angleSel) angleSel.value = String(item.bgGradientAngle);
  }
  renderDeviceById(item.id);
}

// Áp 1 Theme trọn gói (Gradient + Hoạ tiết + Glow + Font + Đổ bóng chữ) cho 1 thiết bị —
// rebuild lại toàn bộ UI (đơn giản hơn vá tay từng input như handleGradientPreset, chấp
// nhận đánh đổi rebuild hơi rộng vì Theme đổi nhiều field cùng lúc).
function handleThemePreset(btn) {
  const item = store.getDevice(btn.dataset.id);
  const theme = THEME_PRESETS.find((t) => t.key === btn.dataset.theme);
  if (!item || !theme) return;
  for (const field of CANVAS_STYLE_FIELDS) item[field] = theme[field];
  ensureFontLoaded(theme.fontFamily).then(rebuildAndRenderAll);
  rebuildAndRenderAll();
  showToast(`🎭 Đã áp Theme "${theme.name}" cho thiết bị này`, 'success');
}

// Copy nguyên bộ style Nền/Gradient/Hoạ tiết/Glow/Font/Đổ bóng chữ từ 1 thiết bị sang TẤT CẢ
// thiết bị còn lại — dùng khi cần cả bộ ảnh Store đồng nhất phong cách mà không phải chỉnh
// tay từng thiết bị một.
function handleApplyStyleToAll(btn) {
  const source = store.getDevice(btn.dataset.id);
  if (!source) return;
  const devices = store.getDevices();
  if (devices.length < 2) {
    showToast('⚠ Chỉ có 1 thiết bị, không có thiết bị nào khác để áp dụng.', 'danger');
    return;
  }
  devices.forEach((d) => {
    if (d.id === source.id) return;
    for (const field of CANVAS_STYLE_FIELDS) d[field] = source[field];
  });
  ensureFontLoaded(source.fontFamily).then(rebuildAndRenderAll);
  rebuildAndRenderAll();
  showToast(`🪄 Đã áp style của thiết bị này cho ${devices.length - 1} thiết bị còn lại.`, 'success');
}

function handleRandomSinglePos(btn) {
  const item = store.getDevice(btn.dataset.id);
  if (!item) return;
  const { titlePos, descPos, badgePos } = getDistinctRandomPositions(TEXT_POSITIONS, BADGE_POSITIONS);
  item.titlePos = titlePos;
  item.descPos = descPos;
  item.badgePos = badgePos;
  rebuildAndRenderAll();
}

async function handleCopyStyle(btn) {
  const item = store.getDevice(btn.dataset.id);
  if (!item) return;
  const idx = store.getDevices().findIndex((d) => d.id === item.id);
  const { viaSystemClipboard } = await copyTextBadgeStyle(item);
  if (viaSystemClipboard) {
    showToast(`📋 Đã copy Tiêu đề/Mô tả/Badge của Thiết bị #${idx + 1} vào Clipboard — dán được sang tab/trình duyệt khác, hoặc gửi cho người khác dán vào.`, 'success');
  } else {
    // Không ghi được vào Clipboard hệ thống (trình duyệt chặn, hoặc trang không chạy HTTPS) ->
    // vẫn Dán được nhưng CHỈ trong tab này.
    showToast(`📋 Đã sao chép Tiêu đề/Mô tả/Badge của Thiết bị #${idx + 1} (chỉ dùng được trong tab này — trình duyệt không cho phép ghi Clipboard hệ thống).`, 'success');
  }
}

async function handlePasteStyle(btn) {
  const item = store.getDevice(btn.dataset.id);
  if (!item) return;
  const result = await pasteTextBadgeStyle(item);
  if (!result.ok) {
    showToast('⚠ Clipboard trống hoặc không phải dữ liệu Tiêu đề/Mô tả/Badge hợp lệ — hãy bấm "📋 Copy" ở 1 thiết bị (hoặc dán tay chuỗi JSON đã được gửi) trước.', 'danger');
    return;
  }
  rebuildAndRenderAll();
  const idx = store.getDevices().findIndex((d) => d.id === item.id);
  showToast(`📥 Đã dán Tiêu đề/Mô tả/Badge vào Thiết bị #${idx + 1}`, 'success');
}

function handleDeleteSingle(btn) {
  const id = btn.dataset.id;
  const item = store.getDevice(id);
  if (!item) return;
  if (!confirm(`Xoá "${item.title || 'thiết bị này'}" khỏi danh sách? Không thể hoàn tác.`)) return;
  store.removeDevice(id);
  buildDeviceUI();
  renderAllDevices();
  updateGlobalButtonsState();
}

// Gắn 3 listener delegation MỘT LẦN DUY NHẤT lúc khởi tạo app (xem app.js).
export function bindDeviceListEvents() {
  const container = $('deviceContainer');
  container.addEventListener('input', handleInput);
  container.addEventListener('change', handleChange);
  container.addEventListener('click', handleClick);
}
