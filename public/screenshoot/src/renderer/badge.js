import { roundedRect } from './shapes.js';

// Renderer con: Badge (nhãn nhỏ như "HOT") — tách khỏi renderer chính theo P0.3.
export function renderBadge(ctx, item, geometry) {
  if (!item.showBadge || !item.badge) return;
  const { uiScale, getOuterX, getOuterY } = geometry;

  ctx.save();
  ctx.font = `700 ${Math.round(30 * uiScale)}px ${item.fontFamily || 'Arial, sans-serif'}`;
  const bw = ctx.measureText(item.badge).width + 48 * uiScale;
  const bh = 58 * uiScale;
  const bx = getOuterX(item.badgePos);
  const by = getOuterY(item.badgePos, bh);
  let rx = bx;
  if (item.badgePos.endsWith('center')) rx = bx - bw / 2;
  if (item.badgePos.endsWith('right')) rx = bx - bw;

  roundedRect(ctx, rx, by, bw, bh, bh / 2);
  ctx.fillStyle = item.badgeBg || '#3B82F6';
  ctx.fill();
  ctx.fillStyle = item.badgeColor || '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(item.badge, rx + bw / 2, by + bh / 2);
  ctx.restore();
}
