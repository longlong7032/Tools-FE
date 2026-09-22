export const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Chọn ngẫu nhiên vị trí cho Tiêu đề/Mô tả/Badge sao cho KHÔNG BAO GIỜ trùng nhau trong
// cùng 1 thiết bị (tránh chữ đè lên nhau). Badge chỉ có 4 vị trí góc (không có "center"),
// nên luôn còn ít nhất 2 lựa chọn hợp lệ dù title/desc đã chiếm 2 trong 4 góc đó.
export function getDistinctRandomPositions(textPositions, badgePositions) {
  const titlePos = getRandomItem(textPositions);
  const remainingForDesc = textPositions.filter((p) => p !== titlePos);
  const descPos = getRandomItem(remainingForDesc);
  const remainingForBadge = badgePositions.filter((p) => p !== titlePos && p !== descPos);
  const badgePos = getRandomItem(remainingForBadge.length ? remainingForBadge : badgePositions);
  return { titlePos, descPos, badgePos };
}
