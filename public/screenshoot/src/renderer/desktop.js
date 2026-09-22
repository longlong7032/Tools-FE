import { roundedRect } from './shapes.js';
import { renderBadge } from './badge.js';
import { renderTitleAndDescription } from './text.js';
import { computeFrameTransform, applyFrameTransform } from './geometry.js';

// Vùng màn hình thực của khung Desktop — tách riêng như phone-tablet-frame.js để
// ui/image-guide-modal.js dùng lại đúng công thức khi gợi ý tỉ lệ ảnh nên dùng.
export function computeDesktopScreenRect(geometry, isMac) {
  const { W, uiScale, wScale, topMargin, bottomMargin } = geometry;
  const H = geometry.H;
  const px = 40 * wScale, pw = W - 80 * wScale;
  const py = topMargin, ph = H - topMargin - bottomMargin;
  const chromeH = (isMac ? 56 : 46) * uiScale;
  return { x: px, y: py + chromeH, w: pw, h: ph - chromeH };
}

// Khung Desktop (macOS / Windows): viền phẳng bo nhẹ + thanh chrome cửa sổ.
// Không dùng bezel/notch kiểu điện thoại vì store screenshot desktop thực tế không có khung máy.
function renderDesktopFrame(ctx, item, geometry, isMac) {
  const { W, uiScale, wScale } = geometry;
  const H = geometry.H;
  const { topMargin, bottomMargin } = geometry;

  const px = 40 * wScale, pw = W - 80 * wScale;
  const py = topMargin, ph = H - topMargin - bottomMargin;
  const outerRadius = 16 * uiScale;

  // Nghiêng/tràn viền chỉ áp cho khung cửa sổ (KHÔNG áp cho badge/tiêu đề/mô tả) — xem
  // renderer/geometry.js và renderer/phone-tablet-frame.js (cùng cơ chế, dùng chung code).
  ctx.save();
  applyFrameTransform(ctx, computeFrameTransform(item, px, py, pw, ph));

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 40 * uiScale; ctx.shadowOffsetY = 16 * uiScale;
  roundedRect(ctx, px, py, pw, ph, outerRadius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  const chromeH = (isMac ? 56 : 46) * uiScale;

  ctx.save();
  roundedRect(ctx, px, py, pw, ph, outerRadius);
  ctx.clip();

  ctx.fillStyle = isMac ? '#e5e5e7' : '#f3f3f3';
  ctx.fillRect(px, py, pw, chromeH);

  if (isMac) {
    // 3 nút đèn giao thông macOS (đỏ/vàng/xanh)
    const dotR = 8 * uiScale, dotY = py + chromeH / 2;
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(px + (24 + i * 24) * uiScale, dotY, dotR, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
    });
  } else {
    // 3 nút điều khiển cửa sổ Windows (thu nhỏ / phóng to / đóng) ở góc phải thanh chrome
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1.5 * uiScale;
    const iconY = py + chromeH / 2, iconSize = 10 * uiScale;
    [0, 1, 2].forEach((i) => {
      const cx = px + pw - (18 + i * 28) * uiScale;
      ctx.beginPath();
      if (i === 0) {
        ctx.moveTo(cx - iconSize / 2, iconY - iconSize / 2);
        ctx.lineTo(cx + iconSize / 2, iconY + iconSize / 2);
        ctx.moveTo(cx + iconSize / 2, iconY - iconSize / 2);
        ctx.lineTo(cx - iconSize / 2, iconY + iconSize / 2);
      } else if (i === 1) {
        ctx.rect(cx - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
      } else {
        ctx.moveTo(cx - iconSize / 2, iconY);
        ctx.lineTo(cx + iconSize / 2, iconY);
      }
      ctx.stroke();
    });
  }

  const screen = computeDesktopScreenRect(geometry, isMac);

  if (item.imgElement) {
    const imgScale = Math.max(screen.w / item.imgElement.width, screen.h / item.imgElement.height);
    const dw = item.imgElement.width * imgScale;
    const dh = item.imgElement.height * imgScale;
    const dx = screen.x + (screen.w - dw) / 2;
    const dy = screen.y + (screen.h - dh) / 2;
    ctx.drawImage(item.imgElement, dx, dy, dw, dh);
  }
  ctx.restore();
  ctx.restore(); // đóng transform nghiêng/tràn viền

  renderBadge(ctx, item, geometry);
  renderTitleAndDescription(ctx, item, geometry);
}

export function renderMacDesktop(ctx, item, geometry) {
  renderDesktopFrame(ctx, item, geometry, true);
}

export function renderWindowsDesktop(ctx, item, geometry) {
  renderDesktopFrame(ctx, item, geometry, false);
}
