// Canvas không tự vẽ lại khi 1 Web Font tải xong (khác DOM) — nếu vẽ text ngay khi vừa đổi
// font, trình duyệt sẽ âm thầm dùng font fallback cho tới khi @font-face tải xong mà không
// có sự kiện nào báo lại. Vì vậy phải chủ động load() rồi mới render.
const loadedFamilies = new Set();

export async function ensureFontLoaded(family) {
  if (!family || family.startsWith('Arial') || loadedFamilies.has(family) || !document.fonts) return;
  try {
    await Promise.allSettled([
      document.fonts.load(`400 32px ${family}`),
      document.fonts.load(`700 32px ${family}`),
      document.fonts.load(`800 32px ${family}`),
    ]);
    loadedFamilies.add(family);
  } catch {
    // Không tải được (mạng chặn Google Fonts...) -> cứ để Canvas dùng font fallback, không chặn UI
  }
}
