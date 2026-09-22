// Renderer chính (orchestrator) — P0.3 + P0.4 + P0.6 + P0.7.
import { DEVICE_SPECS, DEFAULT_DEVICE_KEY } from '../config/device-specs.js';
import { computeGeometry } from './geometry.js';
import { renderIOSPhone, renderIOSPhone65, renderAndroidPhone } from './phone.js';
import { renderIOSTablet, renderAndroidTablet } from './tablet.js';
import { renderMacDesktop, renderWindowsDesktop } from './desktop.js';

// P0.4 — Strategy map thay cho chuỗi if/else theo deviceTypeKey. Thêm 1 thiết bị mới:
// thêm 1 dòng map ở đây + 1 hàm renderer (trong phone.js/tablet.js/desktop.js) — không
// phải sửa hàm renderDevice() bên dưới.
const DEVICE_RENDERERS = {
  'ios-phone': renderIOSPhone,
  'ios-phone-6.5': renderIOSPhone65,
  'android-phone': renderAndroidPhone,
  'ios-tablet': renderIOSTablet,
  'android-tablet': renderAndroidTablet,
  'mac-desktop': renderMacDesktop,
  'win-desktop': renderWindowsDesktop,
};

// Vẽ 1 device lên đúng <canvas> của nó — không phụ thuộc UI, không đọc state global,
// nhận đủ tham số qua đối số (item + deviceTypeKey) để dễ test độc lập.
export function renderDevice(canvas, item, deviceTypeKey) {
  if (!canvas || !item) return;
  const ctx = canvas.getContext('2d');
  const spec = DEVICE_SPECS[deviceTypeKey] || DEVICE_SPECS[DEFAULT_DEVICE_KEY];

  canvas.width = spec.width;
  canvas.height = spec.height;
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = item.bgGradient ? buildBackgroundGradient(ctx, item, W, H) : (item.bgColor || '#1E293B');
  ctx.fillRect(0, 0, W, H);
  drawBackgroundPattern(ctx, item, W, H);
  if (item.bgGlow) drawBackgroundGlow(ctx, W, H);

  const geometry = computeGeometry(item, W, H);
  const renderer = DEVICE_RENDERERS[deviceTypeKey] || DEVICE_RENDERERS[DEFAULT_DEVICE_KEY];
  renderer(ctx, item, geometry);
}

// Nền Canvas dạng Gradient tuyến tính — góc theo quy ước CSS linear-gradient
// (0deg = từ dưới lên trên, 90deg = trái sang phải, 180deg = trên xuống dưới,
// tăng dần theo chiều kim đồng hồ), tính điểm đầu/cuối bằng đúng công thức
// spec CSS Images Level 3 để đường gradient luôn phủ kín toàn bộ canvas.
function buildBackgroundGradient(ctx, item, W, H) {
  const angleRad = ((item.bgGradientAngle ?? 180) * Math.PI) / 180;
  const dx = Math.sin(angleRad);
  const dy = -Math.cos(angleRad);
  const halfLength = (Math.abs(W * dx) + Math.abs(H * dy)) / 2;
  const cx = W / 2, cy = H / 2;
  const gradient = ctx.createLinearGradient(
    cx - dx * halfLength, cy - dy * halfLength,
    cx + dx * halfLength, cy + dy * halfLength,
  );
  gradient.addColorStop(0, item.bgColor || '#1E293B');
  gradient.addColorStop(1, item.bgColor2 || '#0F172A');
  return gradient;
}

// Độ sáng tương đối (0..1) của 1 màu hex — dùng để tự chọn màu hoạ tiết (sáng/tối) sao cho
// luôn nổi rõ trên nền, không phải bắt người dùng tự chọn thêm 1 màu hoạ tiết riêng.
function relativeLuminance(hex) {
  const clean = String(hex || '').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  if ([r, g, b].some(Number.isNaN)) return 0;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Hoạ tiết phủ nhẹ lên nền Canvas (chấm bi/lưới/sọc chéo) — vẽ SAU khi tô nền (đặc hoặc
// gradient), TRƯỚC khi vẽ khung máy, để không bao giờ đè lên nội dung/tiêu đề.
function drawBackgroundPattern(ctx, item, W, H) {
  if (!item.bgPattern || item.bgPattern === 'none') return;
  const overlay = relativeLuminance(item.bgColor) > 0.55 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.12)';
  const gap = Math.round(Math.min(W, H) / 18);

  ctx.save();
  ctx.strokeStyle = overlay;
  ctx.fillStyle = overlay;

  if (item.bgPattern === 'dots') {
    const r = gap * 0.06;
    for (let y = gap / 2; y < H; y += gap) {
      for (let x = gap / 2; x < W; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (item.bgPattern === 'grid') {
    ctx.lineWidth = Math.max(1, gap * 0.02);
    for (let x = 0; x <= W; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += gap) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  } else if (item.bgPattern === 'diagonal') {
    ctx.lineWidth = Math.max(1, gap * 0.03);
    for (let x = -H; x < W; x += gap) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke(); }
  } else if (item.bgPattern === 'waves') {
    ctx.lineWidth = Math.max(1, gap * 0.05);
    const amp = gap * 0.35;
    for (let y = gap; y < H; y += gap) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += Math.max(6, gap * 0.15)) {
        const yy = y + Math.sin((x / gap) * Math.PI) * amp;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  } else if (item.bgPattern === 'circles') {
    ctx.lineWidth = Math.max(1, gap * 0.035);
    for (let y = gap / 2; y < H; y += gap) {
      for (let x = gap / 2; x < W; x += gap) {
        ctx.beginPath();
        ctx.arc(x, y, gap * 0.32, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  } else if (item.bgPattern === 'cross') {
    const half = gap * 0.16;
    ctx.lineWidth = Math.max(1, gap * 0.04);
    for (let y = gap / 2; y < H; y += gap) {
      for (let x = gap / 2; x < W; x += gap) {
        ctx.beginPath();
        ctx.moveTo(x - half, y); ctx.lineTo(x + half, y);
        ctx.moveTo(x, y - half); ctx.lineTo(x, y + half);
        ctx.stroke();
      }
    }
  } else if (item.bgPattern === 'rays') {
    // Toả tia từ 1 điểm chếch trên-giữa Canvas, kẻ SỌC (không phải fill toàn quạt) để
    // hoạ tiết vẫn nhẹ, không lấn át nội dung — giống ánh sáng hắt trong ảnh marketing.
    const cx = W * 0.5, cy = -H * 0.1;
    const rayCount = 28;
    const maxR = Math.hypot(W, H * 1.2) * 1.4;
    ctx.lineWidth = Math.max(1, gap * 0.06);
    for (let i = 0; i < rayCount; i += 2) {
      const angle = (i / rayCount) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.stroke();
    }
  } else if (item.bgPattern === 'noise') {
    // Hạt nhiễu (grain) rải trên lưới nhưng lệch vị trí/kích thước theo hash xác định (KHÔNG
    // dùng Math.random()) — để hoạ tiết đứng yên giữa các lần vẽ lại (gõ chữ, đổi màu...)
    // thay vì "nhấp nháy" đổi hạt mỗi lần render. Dùng màu ĐẶC (không alpha sẵn trong fillStyle
    // như các hoạ tiết khác) rồi tự chỉnh globalAlpha — nếu dùng lại `overlay` (đã có alpha
    // ~0.1-0.12) thì 2 lớp alpha nhân dồn vào nhau, hạt mờ gần như vô hình.
    ctx.fillStyle = relativeLuminance(item.bgColor) > 0.55 ? '#000000' : '#FFFFFF';
    const cell = Math.max(6, gap * 0.22);
    let i = 0;
    for (let y = cell / 2; y < H; y += cell) {
      for (let x = cell / 2; x < W; x += cell) {
        const r1 = hash01(i, 1.3), r2 = hash01(i, 7.7), r3 = hash01(i, 19.1);
        i += 1;
        if (r1 > 0.5) continue; // rải thưa, không phủ kín 100% ô lưới
        ctx.globalAlpha = 0.18 + r1 * 0.55;
        ctx.beginPath();
        ctx.arc(x + (r2 - 0.5) * cell, y + (r3 - 0.5) * cell, cell * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// Số giả ngẫu nhiên xác định (0..1) theo 2 "seed" — dùng cho hoạ tiết 'noise' để vị trí/độ
// mờ mỗi hạt luôn CỐ ĐỊNH theo chỉ số ô lưới, không đổi giữa các lần vẽ lại như Math.random().
function hash01(i, seed) {
  const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Hiệu ứng Glow nền — vài vệt sáng mờ (radial gradient + blend "lighter") đặt ở góc nền,
// giống ảnh sản phẩm/marketing hiện đại. Dùng "lighter" (cộng dồn sáng) thay vì alpha thường
// để luôn cho ra hiệu ứng bừng sáng đẹp mắt bất kể nền đang là màu gì (đặc hay gradient).
function drawBackgroundGlow(ctx, W, H) {
  const blobs = [
    { x: W * 0.18, y: H * 0.12, r: Math.min(W, H) * 0.40, alpha: 0.22 },
    { x: W * 0.85, y: H * 0.85, r: Math.min(W, H) * 0.36, alpha: 0.18 },
  ];
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  blobs.forEach(({ x, y, r, alpha }) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ==========================================================================
// P0.6/P0.7 — Dirty-render scheduler.
// Trước đây mỗi lần gõ phím/đổi màu là render Canvas ngay lập tức, đồng bộ —
// gõ "App Test" (9 ký tự) có thể trigger 9 lần render liên tiếp trong cùng 1
// frame. Giờ mọi thay đổi chỉ ĐÁNH DẤU device "dirty" (scheduleRender(id)),
// gom lại bằng requestAnimationFrame, và CHỈ render đúng những device đã đổi
// — không render lại toàn bộ danh sách nếu không cần.
// ==========================================================================
let renderCallback = null;
const dirtyIds = new Set();
let rafHandle = null;

// app.js gọi 1 lần lúc khởi tạo để cung cấp cách "render 1 device theo id"
// (canvas.js không tự biết DOM/Store, nhận callback từ tầng trên).
export function initRenderScheduler(callback) {
  renderCallback = callback;
}

// Đánh dấu 1 device cần vẽ lại; nhiều lần gọi liên tiếp trong cùng frame chỉ tốn 1 lần vẽ.
export function scheduleRender(id) {
  if (!id) return;
  dirtyIds.add(id);
  if (rafHandle) return;
  rafHandle = requestAnimationFrame(flushRenderQueue);
}

// Đánh dấu nhiều device cùng lúc (vd: đổi loại thiết bị -> toàn bộ list cần vẽ lại).
export function scheduleRenderAll(ids) {
  ids.forEach((id) => dirtyIds.add(id));
  if (rafHandle) return;
  rafHandle = requestAnimationFrame(flushRenderQueue);
}

function flushRenderQueue() {
  rafHandle = null;
  const ids = Array.from(dirtyIds);
  dirtyIds.clear();
  if (!renderCallback) return;
  ids.forEach((id) => renderCallback(id));
}

// Dùng cho test: đảm bảo hàng đợi được xả ngay, không cần chờ requestAnimationFrame thật.
export function __flushRenderQueueForTest() {
  if (rafHandle) {
    cancelAnimationFrame(rafHandle);
  }
  flushRenderQueue();
}
