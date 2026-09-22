// Renderer con: chữ (tiêu đề/mô tả) — tách khỏi renderer chính theo P0.3.
export function wrapText(ctx, text, maxWidth, font) {
  ctx.font = font;
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line); line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawOuterText(ctx, text, posMode, x, y, size, weight, maxWidth, lineHeight, color, fontFamily, shadow) {
  const font = `${weight} ${size}px ${fontFamily || 'Arial, sans-serif'}`;
  const lines = wrapText(ctx, String(text), maxWidth, font);

  ctx.save();
  ctx.font = font;
  ctx.textAlign = posMode.endsWith('left') ? 'left' : (posMode.endsWith('right') ? 'right' : 'center');
  ctx.textBaseline = 'top';
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.06;
  }

  lines.forEach((line, i) => {
    ctx.fillStyle = color || '#FFFFFF';
    ctx.fillText(line, x, y + i * lineHeight);
  });
  ctx.restore();
}

// Vẽ khối tiêu đề + mô tả bên ngoài khung thiết bị (trong vùng topMargin/bottomMargin).
export function renderTitleAndDescription(ctx, item, geometry) {
  const { W, wScale, getOuterX, getOuterY } = geometry;

  if (item.showTitle && item.title) {
    drawOuterText(
      ctx, item.title, item.titlePos,
      getOuterX(item.titlePos), getOuterY(item.titlePos, item.titleSize),
      item.titleSize, 800, W - 120 * wScale, item.titleSize * 1.15, item.titleColor,
      item.fontFamily, item.textShadow
    );
  }

  if (item.showDesc && item.desc) {
    let dy = getOuterY(item.descPos, item.descSize);
    if (item.showTitle && item.titlePos.split('-')[0] === item.descPos.split('-')[0]) {
      dy += (item.titleSize || 64) + 15 * geometry.hScale;
    }
    drawOuterText(
      ctx, item.desc, item.descPos,
      getOuterX(item.descPos), dy,
      item.descSize, 400, W - 120 * wScale, item.descSize * 1.35, item.descColor,
      item.fontFamily, item.textShadow
    );
  }
}
