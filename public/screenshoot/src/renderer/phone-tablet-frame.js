// Thuật toán vẽ khung dùng CHUNG cho cả Phone và Tablet — chỉ khác nhau ở bộ số trong
// FRAME_CONFIGS (bezel/outerRadius...), không khác nhau ở cách vẽ. Vì vậy đặt chung 1 chỗ
// thay vì lặp lại code giữa renderer/phone.js và renderer/tablet.js.
import { roundedRect } from './shapes.js';
import { renderBadge } from './badge.js';
import { renderTitleAndDescription } from './text.js';
import { computeFrameTransform, applyFrameTransform } from './geometry.js';

// Vùng màn hình thực (nơi ảnh screenshot người dùng được vẽ vào) — tách riêng vì UI hướng dẫn
// (ui/image-guide-modal.js) cũng cần tính đúng công thức này để gợi ý tỉ lệ ảnh nên dùng,
// tránh lặp lại công thức ở 2 nơi rồi lệch nhau khi có người sửa 1 chỗ.
//
// Bề rộng khung (pw/px) được TÍNH NGƯỢC từ tỉ lệ khung hình gốc của thiết bị (W:H — chính là
// độ phân giải màn hình thật khai báo trong DEVICE_SPECS), thay vì dùng 1 sideMargin cố định.
// Lý do: topMargin/bottomMargin (chỗ chừa cho tiêu đề/mô tả) thay đổi tuỳ tổ hợp vị trí RANDOM
// mỗi ảnh (xem geometry.js) — nếu sideMargin cố định, screen.h co giãn theo nhưng screen.w thì
// không, làm tỉ lệ vùng ảnh lệch khỏi tỉ lệ ảnh chụp màn hình thật → ảnh luôn bị crop bớt 1
// phần (từng thấy: sideMargin cố định làm mất chữ mép trái, hoặc mất cả thanh header/nav khi
// tiêu đề bật). Tính động theo tỉ lệ W:H đảm bảo vùng ảnh luôn khớp ảnh gốc, không crop, ở MỌI
// tổ hợp tiêu đề/mô tả/badge.
export function computeScreenRect(geometry, config) {
  const { W, uiScale, topMargin, bottomMargin } = geometry;
  const H = geometry.H;

  const bezel = config.bezel * uiScale;
  const py = topMargin;
  const ph = H - topMargin - bottomMargin;

  // Dynamic Island không còn chừa riêng 1 dải trống phía trên nữa — ảnh chụp màn hình
  // phủ kín toàn bộ vùng màn hình (đúng như máy thật), viên Dynamic Island được vẽ ĐÈ LÊN
  // TRÊN ảnh sau đó (xem renderPhoneTabletFrame), không phải 1 vùng nền trắng tách biệt.
  const screenH = ph - bezel * 2;
  const screenW = screenH * (W / H);
  const pw = screenW + bezel * 2;
  const px = (W - pw) / 2;

  return {
    x: px + bezel, y: py + bezel, w: screenW, h: screenH,
    px, py, pw, ph, bezel,
  };
}

export function renderPhoneTabletFrame(ctx, item, geometry, config) {
  const { W, uiScale } = geometry;

  const { x: sx, y: sy, w: sw, h: sh, px, py, pw, ph, bezel } = computeScreenRect(geometry, config);
  const screen = { x: sx, y: sy, w: sw, h: sh };
  const islandH = 34 * uiScale;
  const islandMarginTop = 20 * uiScale;

  const outerRadius = config.outerRadius * uiScale;
  const innerRadius = config.innerRadiusOffset === 'bezel'
    ? outerRadius - bezel
    : config.innerRadiusOffset === 'half-bezel'
      ? outerRadius - bezel / 2
      : outerRadius - config.innerRadiusOffset * uiScale;

  // Khung ngoài (vỏ máy + màn hình) được vẽ trong 1 transform riêng (nghiêng/tràn viền —
  // xem geometry.js) rồi ctx.restore() NGAY trước khi vẽ badge/tiêu đề/mô tả, để chữ luôn
  // nằm ngang và không bị phóng to/thu nhỏ theo khung.
  ctx.save();
  applyFrameTransform(ctx, computeFrameTransform(item, px, py, pw, ph));

  // Vỏ thiết bị
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 50 * uiScale; ctx.shadowOffsetY = 20 * uiScale;
  roundedRect(ctx, px, py, pw, ph, outerRadius);
  ctx.fillStyle = item.phoneColor || '#000000';
  ctx.fill();
  ctx.restore();

  // Nút bấm hông máy (âm lượng bên trái, nguồn bên phải) — luôn nằm NGOÀI vùng ảnh nên
  // không bao giờ đè lên nội dung, chỉ là chi tiết phần cứng giúp khung trông giống máy thật.
  ctx.fillStyle = item.phoneColor || '#000000';
  const btnW = Math.max(4, 6 * uiScale), btnR = 2 * uiScale;
  roundedRect(ctx, px - btnW, py + ph * 0.16, btnW, ph * 0.05, btnR); ctx.fill();
  roundedRect(ctx, px - btnW, py + ph * 0.24, btnW, ph * 0.08, btnR); ctx.fill();
  roundedRect(ctx, px + pw, py + ph * 0.18, btnW, ph * 0.09, btnR); ctx.fill();

  // Camera-dot (iPad) nằm TRONG dải viền, KHÔNG nằm trên vùng ảnh — phải vẽ TRƯỚC khi
  // ctx.clip() xuống vùng màn hình bên dưới, nếu không sẽ bị clip mất (viền nằm ngoài vùng
  // clip đó). Ngược lại notch/island (điện thoại) dính liền/nổi trên ảnh nên vẫn vẽ trong clip.
  if (config.topCutout === 'camera-dot') {
    drawCameraDot(ctx, py, bezel, W);
  }

  ctx.save();
  roundedRect(ctx, px + bezel, py + bezel, pw - bezel * 2, ph - bezel * 2, innerRadius);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.clip();

  if (item.imgElement) {
    const imgScale = Math.max(screen.w / item.imgElement.width, screen.h / item.imgElement.height);
    const dw = item.imgElement.width * imgScale;
    const dh = item.imgElement.height * imgScale;
    const dx = screen.x + (screen.w - dw) / 2;
    const dy = screen.y + (screen.h - dh) / 2;
    ctx.drawImage(item.imgElement, dx, dy, dw, dh);
  }

  // "Khuyết màn hình" vẽ ĐÈ LÊN TRÊN ảnh (trong cùng vùng clip bo góc màn hình) — giống hệt
  // máy thật, chi tiết luôn nổi trên nội dung app chứ không phải 1 dải nền trắng riêng.
  if (config.topCutout === 'island') {
    const islandW = pw * 0.30;
    const islandX = W / 2 - islandW / 2, islandY = screen.y + islandMarginTop;
    roundedRect(ctx, islandX, islandY, islandW, islandH, islandH / 2);
    ctx.fillStyle = '#000000';
    ctx.fill();
    // Chấm camera nhỏ bên trong Dynamic Island cho giống thật
    ctx.beginPath();
    ctx.arc(islandX + islandW - islandH * 0.55, islandY + islandH / 2, islandH * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
  } else if (config.topCutout === 'notch') {
    drawNotch(ctx, screen, W, uiScale);
  }

  ctx.restore();
  ctx.restore(); // đóng transform nghiêng/tràn viền — badge/tiêu đề/mô tả vẽ thẳng, không nghiêng theo

  renderBadge(ctx, item, geometry);
  renderTitleAndDescription(ctx, item, geometry);
}

// Tai thỏ (notch) dính liền mép trên màn hình — iPhone 6.5″ (11 Pro Max/XS Max) KHÔNG có
// Dynamic Island nổi như dòng Pro, mà là 1 khối đen liền viền chứa loa thoại + camera trước.
function drawNotch(ctx, screen, W, uiScale) {
  const notchW = screen.w * 0.42;
  const notchH = 34 * uiScale;
  const r = 16 * uiScale;
  const x = W / 2 - notchW / 2;
  const y = screen.y;

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + notchW, y);
  ctx.lineTo(x + notchW, y + notchH - r);
  ctx.arcTo(x + notchW, y + notchH, x + notchW - r, y + notchH, r);
  ctx.lineTo(x + r, y + notchH);
  ctx.arcTo(x, y + notchH, x, y + notchH - r, r);
  ctx.closePath();
  ctx.fillStyle = '#000000';
  ctx.fill();

  // Loa thoại (thanh nhỏ giữa notch)
  const speakerW = notchW * 0.26, speakerH = 5 * uiScale;
  roundedRect(ctx, W / 2 - speakerW / 2, y + notchH * 0.34, speakerW, speakerH, speakerH / 2);
  ctx.fillStyle = '#1a1a2e';
  ctx.fill();

  // Camera trước (chấm tròn lệch phải trong notch)
  ctx.beginPath();
  ctx.arc(x + notchW - notchH * 0.5, y + notchH * 0.56, notchH * 0.17, 0, Math.PI * 2);
  ctx.fillStyle = '#2a2f3a';
  ctx.fill();
}

// Chấm camera trước của iPad — nằm giữa dải viền TRÊN màn hình (không dính vào ảnh chụp
// màn hình như notch/island của điện thoại), đúng vị trí thật trên iPad Pro 13″. Viền bezel
// của iPad rất mỏng nên phải vẽ 3 lớp (viền sáng hơn vỏ máy / mắt kính đen / tia sáng phản
// chiếu) mới đủ tương phản để thấy được trên vỏ máy màu đen mặc định — 1 chấm đen đặc trên
// vỏ đen sẽ biến mất hoàn toàn.
function drawCameraDot(ctx, py, bezel, W) {
  const cx = W / 2; // khung luôn canh giữa Canvas theo chiều ngang
  const cy = py + bezel / 2;
  const r = bezel * 0.34;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#3a3f4a'; // viền ánh kim, sáng hơn vỏ máy để luôn nổi rõ dù vỏ máy màu gì
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.fillStyle = '#05070d'; // mắt kính camera
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx - r * 0.18, cy - r * 0.18, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; // tia sáng phản chiếu trên mắt kính
  ctx.fill();
}
