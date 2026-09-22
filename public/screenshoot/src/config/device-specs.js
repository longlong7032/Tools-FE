// ==========================================================================
// P0.1/P0.4 — Cấu hình thiết bị & preset khung vẽ, tách khỏi UI/renderer.
// Thêm 1 thiết bị mới CHỈ cần sửa file này (DEVICE_SPECS + FRAME_CONFIGS nếu
// là loại phone/tablet) — không phải sửa renderer hay UI select.
// ==========================================================================

export const DEVICE_SPECS = {
  // ==========================================
  // 1. MOBILE (PHONE)
  // ==========================================
  // iPhone 6.5″ — bezel phẳng, KHÔNG tai thỏ, KHÔNG Dynamic Island (dành cho khi cần khung
  // "sạch", không muốn khuyết màn hình che nội dung ảnh chụp).
  'ios-phone': { name: 'iPhone (6.5″ — Không tai thỏ)', width: 1242, height: 2688 },
  // iPhone 6.5″ (11 Pro Max / XS Max — có tai thỏ, KHÔNG có Dynamic Island)
  'ios-phone-6.5': { name: 'iPhone (6.5″ — Tai thỏ)', width: 1242, height: 2688 },
  // Android Phone (Có Camera đục lỗ Punch-hole + Cử chỉ Android)
  'android-phone': { name: 'Android Phone (FHD+)', width: 1290, height: 2796 },

  // ==========================================
  // 2. TABLET - Tỷ lệ 3:4 (2048 x 2732 px)
  // ==========================================
  // iPad Pro 13″ / 12.9″ (Khung viền đều, bo tròn góc iPadOS)
  'ios-tablet': { name: 'iPad Pro (Universal 13″)', width: 2048, height: 2732 },
  // Android Tablet (Up chung cho cả 7″ & 10″ trên Google Play)
  'android-tablet': { name: 'Android Tablet (Universal)', width: 2048, height: 2732 },

  // ==========================================
  // 3. DESKTOP - Tỷ lệ 16:10 (2880 x 1800 px)
  // ==========================================
  // macOS (Có thanh Menu Bar + Tai thỏ MacBook / Khung cửa sổ macOS)
  'mac-desktop': { name: 'macOS (Universal)', width: 2880, height: 1800 },
  // Windows (Có Taskbar ở dưới + Khung cửa sổ Windows)
  'win-desktop': { name: 'Windows (Universal)', width: 2880, height: 1800 },
};

// Nhóm hiển thị trong <select> Loại thiết bị — sinh options TỰ ĐỘNG từ DEVICE_SPECS,
// nên sau này chỉ cần sửa DEVICE_SPECS (thêm/bớt/đổi key) là UI tự cập nhật theo.
export const DEVICE_GROUPS = [
  { label: '📱 iOS – App Store', keys: ['ios-phone', 'ios-phone-6.5', 'ios-tablet'] },
  { label: '🤖 Android – Google Play', keys: ['android-phone', 'android-tablet'] },
  { label: '🖥 macOS – Mac App Store', keys: ['mac-desktop'] },
  { label: '🪟 Windows – Microsoft Store', keys: ['win-desktop'] },
];

export const DEFAULT_DEVICE_KEY = 'android-phone';

// Thiết bị Desktop (macOS/Windows) không vẽ khung điện thoại/tablet (bezel bo tròn + notch) —
// dùng khung cửa sổ phẳng (thanh chrome + góc bo nhẹ) cho đúng thực tế screenshot desktop.
export const DESKTOP_DEVICE_KEYS = new Set(['mac-desktop', 'win-desktop']);

// P0.4 — Bảng cấu hình khung Phone/Tablet, dùng để tra cứu thay vì if/else trong renderer.
// Toàn bộ số dưới đây tính theo REF_W=1080 (nhân với wScale/uiScale lúc render, xem renderer/frame.js).
// Thêm 1 phone/tablet mới: chỉ cần thêm 1 dòng ở đây, KHÔNG cần sửa renderer/phone.js hay tablet.js.
// KHÔNG có sideMargin — bề rộng khung được renderer/phone-tablet-frame.js TÍNH NGƯỢC từ chính
// tỉ lệ width:height của DEVICE_SPECS (= độ phân giải màn hình thật của thiết bị) mỗi lần vẽ,
// để vùng ảnh luôn khớp đúng tỉ lệ ảnh chụp màn hình gốc — không crop — bất kể tiêu đề/mô tả
// (vị trí random mỗi ảnh) đang chừa bao nhiêu khoảng trên/dưới.
// topCutout — chi tiết "khuyết màn hình" đặc trưng của từng dòng máy, vẽ ĐÈ LÊN ảnh trong
// renderPhoneTabletFrame(): 'island' (Dynamic Island nổi, iPhone 14 Pro+), 'notch' (tai thỏ
// dính liền mép trên, iPhone 6.5″/XS Max/11 Pro Max — KHÔNG có Dynamic Island), 'camera-dot'
// (chấm camera trước nằm giữa viền, iPad), 'none' (không vẽ gì thêm).
export const FRAME_CONFIGS = {
  'ios-phone': { bezel: 32, outerRadius: 140, innerRadiusOffset: 'bezel', topCutout: 'none' },
  'ios-phone-6.5': { bezel: 32, outerRadius: 140, innerRadiusOffset: 'bezel', topCutout: 'notch' },
  'android-phone': { bezel: 28, outerRadius: 100, innerRadiusOffset: 'bezel', topCutout: 'none' },
  'ios-tablet': { bezel: 20, outerRadius: 80, innerRadiusOffset: 'half-bezel', topCutout: 'camera-dot' },
  'android-tablet': { bezel: 22, outerRadius: 60, innerRadiusOffset: 16, topCutout: 'none' },
};

// Kiểu bố cục khung thiết bị trên Canvas — mặc định vẽ thẳng, hoặc chọn Nghiêng/Tràn viền
// để ảnh đỡ đơn điệu khi xếp nhiều ảnh liền nhau (renderer/geometry.js: computeFrameTransform).
export const FRAME_LAYOUT_OPTIONS = [
  { value: 'straight', label: '▭ Thẳng' },
  { value: 'tilted', label: '◹ Nghiêng' },
  { value: 'bleed', label: '⬒ Tràn viền (phóng to, cắt nửa dưới)' },
];
export const DEFAULT_FRAME_TILT = -8;

export const TEXT_POSITIONS = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
export const BADGE_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

export const DEFAULT_COLOR_TOKENS = {
  TextLight: '#FFFFFF',
  TextMuted: '#E2E8F0',
  PrimaryBlue: '#3B82F6',
  DarkBackground: '#1E293B',
  AccentRed: '#EF4444',
};

// Bộ phối màu Gradient dựng sẵn — người dùng bấm 1 phát ra ngay 1 combo màu đẹp thay vì
// tự mò 2 mã hex. Angle theo đúng quy ước CSS linear-gradient dùng trong renderer/canvas.js.
export const GRADIENT_PRESETS = [
  { name: 'Sunset', from: '#FF512F', to: '#DD2476', angle: 135 },
  { name: 'Ocean', from: '#2E3192', to: '#1BFFFF', angle: 180 },
  { name: 'Purple Dream', from: '#8E2DE2', to: '#4A00E0', angle: 135 },
  { name: 'Peach', from: '#FFB88C', to: '#DE6262', angle: 180 },
  { name: 'Midnight', from: '#0F2027', to: '#2C5364', angle: 180 },
  { name: 'Forest', from: '#134E5E', to: '#71B280', angle: 135 },
  { name: 'Candy', from: '#FC5C7D', to: '#6A82FB', angle: 90 },
  { name: 'Gold', from: '#F7971E', to: '#FFD200', angle: 90 },
];

// Font chữ cho Tiêu đề/Mô tả/Badge — "family" là giá trị dùng thẳng trong ctx.font của Canvas,
// đã kèm fallback. Arial dùng font hệ thống (luôn sẵn có); các font còn lại tải qua Google
// Fonts (xem <link> trong index.html) nên cần ensureFontLoaded() trước khi vẽ (utils/fonts.js).
export const FONT_OPTIONS = [
  { key: 'arial', label: 'Arial (Mặc định)', family: 'Arial, sans-serif' },
  { key: 'inter', label: 'Inter', family: '"Inter", sans-serif' },
  { key: 'poppins', label: 'Poppins', family: '"Poppins", sans-serif' },
  { key: 'montserrat', label: 'Montserrat', family: '"Montserrat", sans-serif' },
  { key: 'bebas', label: 'Bebas Neue', family: '"Bebas Neue", sans-serif' },
  { key: 'playfair', label: 'Playfair Display', family: '"Playfair Display", serif' },
];
export const DEFAULT_FONT_FAMILY = FONT_OPTIONS[0].family;

// Hoạ tiết phủ nhẹ lên trên nền Canvas (màu tự chọn sáng/tối theo độ sáng nền, xem
// renderer/canvas.js) — điểm nhấn nhỏ giúp nền đỡ đơn điệu mà không che nội dung.
export const BG_PATTERN_OPTIONS = [
  { value: 'none', label: 'Không' },
  { value: 'dots', label: '⠿ Chấm bi' },
  { value: 'grid', label: '▦ Lưới ô vuông' },
  { value: 'diagonal', label: '▨ Sọc chéo' },
  { value: 'waves', label: '〰 Sóng lượn' },
  { value: 'circles', label: '◎ Vòng tròn' },
  { value: 'cross', label: '✛ Dấu cộng' },
  { value: 'rays', label: '☀ Tia sáng' },
  { value: 'noise', label: '⁘ Hạt nhiễu' },
];

// Nhóm field thuộc về "phong cách nền/khung Canvas" (không phải nội dung Tiêu đề/Mô tả/Badge)
// — dùng cho nút "🪄 Áp style cho tất cả" (copy nguyên bộ này từ 1 thiết bị sang toàn bộ
// thiết bị khác) và cho Theme Preset bên dưới, để 2 tính năng luôn đồng bộ đúng 1 danh sách
// field, không lệch nhau khi sau này thêm/bớt.
export const CANVAS_STYLE_FIELDS = [
  'bgColor', 'bgGradient', 'bgColor2', 'bgGradientAngle', 'bgPattern', 'bgGlow',
  'phoneColor', 'fontFamily', 'textShadow',
];

function fontFamilyOf(key) {
  return FONT_OPTIONS.find((f) => f.key === key).family;
}

// Theme trọn gói — bấm 1 phát ra cả bộ Gradient + Hoạ tiết + Glow + Font + Đổ bóng chữ phối
// sẵn, thay vì phải tự phối từng phần riêng lẻ (gradient preset / font / pattern / glow).
export const THEME_PRESETS = [
  {
    key: 'minimal', name: 'Tối giản',
    bgColor: '#111827', bgGradient: false, bgColor2: '#111827', bgGradientAngle: 180,
    bgPattern: 'none', bgGlow: false,
    fontFamily: fontFamilyOf('inter'), textShadow: false, phoneColor: '#000000',
  },
  {
    key: 'vibrant', name: 'Rực rỡ',
    bgColor: '#FC5C7D', bgGradient: true, bgColor2: '#6A82FB', bgGradientAngle: 90,
    bgPattern: 'dots', bgGlow: true,
    fontFamily: fontFamilyOf('poppins'), textShadow: true, phoneColor: '#000000',
  },
  {
    key: 'elegant', name: 'Sang trọng',
    bgColor: '#0F2027', bgGradient: true, bgColor2: '#2C5364', bgGradientAngle: 180,
    bgPattern: 'none', bgGlow: true,
    fontFamily: fontFamilyOf('playfair'), textShadow: true, phoneColor: '#000000',
  },
  {
    key: 'sweet', name: 'Ngọt ngào',
    bgColor: '#FFB88C', bgGradient: true, bgColor2: '#DE6262', bgGradientAngle: 180,
    bgPattern: 'dots', bgGlow: false,
    fontFamily: fontFamilyOf('montserrat'), textShadow: false, phoneColor: '#1A1A1A',
  },
  {
    key: 'tech', name: 'Công nghệ',
    bgColor: '#2E3192', bgGradient: true, bgColor2: '#1BFFFF', bgGradientAngle: 180,
    bgPattern: 'grid', bgGlow: true,
    fontFamily: fontFamilyOf('bebas'), textShadow: true, phoneColor: '#000000',
  },
];

// Trường màu có thể gắn với Color Token, dùng để đồng bộ khi token được cập nhật/import (P0.2 store dùng lại)
export const TOKEN_COLOR_FIELDS = [
  { colorField: 'titleColor', useTokenField: 'titleUseToken', keyField: 'titleColorKey' },
  { colorField: 'descColor', useTokenField: 'descUseToken', keyField: 'descColorKey' },
  { colorField: 'badgeBg', useTokenField: 'badgeBgUseToken', keyField: 'badgeBgKey' },
  { colorField: 'badgeColor', useTokenField: 'badgeColorUseToken', keyField: 'badgeColorKey' },
];
