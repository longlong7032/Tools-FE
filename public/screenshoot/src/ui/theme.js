import { $ } from '../utils/dom.js';

// --- TOGGLE DARK MODE / LIGHT MODE ---
// data-bs-theme trên <html> đã được set sớm ở <head> (xem index.html) để tránh nháy sáng/tối
// khi tải trang; ở đây chỉ cần đồng bộ icon nút và xử lý click để đổi theme + lưu lựa chọn.
const THEME_STORAGE_KEY = 'screenshotGeneratorTheme';

export function syncThemeToggleIcon() {
  const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  const btn = $('themeToggleBtn');
  btn.textContent = isDark ? '☀️' : '🌙';
  btn.title = isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối';
}

export function initThemeToggle() {
  syncThemeToggleIcon();
  $('themeToggleBtn').addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-bs-theme') === 'dark';
    const nextTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-bs-theme', nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    syncThemeToggleIcon();
  });
}
