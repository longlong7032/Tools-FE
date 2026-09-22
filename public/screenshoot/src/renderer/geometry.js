// Tính toán tỉ lệ/lề dùng chung cho mọi loại khung (phone/tablet/desktop) — tách khỏi
// renderer chính theo P0.3. Toàn bộ hằng số layout được tinh chỉnh gốc theo Android
// Phone 1080×1920. Vì các preset Desktop/Tablet chênh lệch tỉ lệ rất lớn (portrait 9:20
// tới landscape 16:9, 768px tới 4K), cần co giãn theo 2 trục riêng: hScale cho khoảng
// cách dọc (lề trên/dưới), wScale cho khoảng cách ngang (bezel khung máy), uiScale (nhỏ
// hơn trong 2 trục) cho các chi tiết "chrome" (bezel dày, bo góc, badge...) để không bị
// phồng to bất thường ở chiều bị giới hạn.
const REF_W = 1080;
const REF_H = 1920;

export function computeGeometry(item, W, H) {
  const hScale = H / REF_H;
  const wScale = W / REF_W;
  const uiScale = Math.min(wScale, hScale);

  const topMargin = ((item.showTitle && item.titlePos.startsWith('top')) || (item.showDesc && item.descPos.startsWith('top')) ? 280 : 160) * hScale;
  const bottomMargin = ((item.showTitle && item.titlePos.startsWith('bottom')) || (item.showDesc && item.descPos.startsWith('bottom')) ? 260 : 160) * hScale;

  const getOuterY = (position, elHeight = 60 * hScale) =>
    position.startsWith('top')
      ? (topMargin / 2) - (elHeight / 2) + 20 * hScale
      : (H - bottomMargin) + (bottomMargin / 2) - (elHeight / 2);

  const getOuterX = (position) =>
    position.endsWith('left') ? 60 * wScale : (position.endsWith('right') ? W - 60 * wScale : W / 2);

  return { W, H, hScale, wScale, uiScale, topMargin, bottomMargin, getOuterX, getOuterY };
}

// Biến đổi (nghiêng/tràn viền) áp dụng CHỈ cho khung thiết bị (vỏ máy + màn hình) — dùng
// bởi renderer/phone-tablet-frame.js và renderer/desktop.js, luôn ctx.restore() TRƯỚC khi
// vẽ badge/tiêu đề/mô tả nên chữ luôn nằm ngang, không bị nghiêng/phóng to theo khung.
// - 'tilted': xoay quanh tâm khung 1 góc nhỏ (item.frameTilt, độ) để ảnh đỡ tĩnh/đơn điệu.
// - 'bleed': phóng to khung rồi đẩy xuống để nửa dưới máy tràn ra ngoài mép Canvas dưới
//   (Canvas tự clip phần vẽ ra ngoài, không cần ctx.clip() riêng) — giống kiểu ảnh hero
//   "zoom vào phần trên máy" hay dùng trong ảnh Store.
export function computeFrameTransform(item, px, py, pw, ph) {
  const layout = item.frameLayout || 'straight';
  const pivotX = px + pw / 2, pivotY = py + ph / 2;

  if (layout === 'tilted') {
    return { pivotX, pivotY, rotate: ((item.frameTilt ?? -8) * Math.PI) / 180, scale: 1, dy: 0 };
  }
  if (layout === 'bleed') {
    return { pivotX, pivotY, rotate: 0, scale: 1.32, dy: ph * 0.30 };
  }
  return { pivotX, pivotY, rotate: 0, scale: 1, dy: 0 };
}

// Áp transform lên ctx hiện tại — gọi giữa ctx.save()/ctx.restore(), TRƯỚC khi vẽ khung.
export function applyFrameTransform(ctx, transform) {
  const { pivotX, pivotY, rotate, scale, dy } = transform;
  if (!rotate && scale === 1 && !dy) return; // straight: bỏ qua, tránh translate/scale thừa
  ctx.translate(pivotX, pivotY + dy);
  ctx.rotate(rotate);
  ctx.scale(scale, scale);
  ctx.translate(-pivotX, -pivotY);
}
