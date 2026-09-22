// ==========================================================================
// P0.8 — Device Schema
// ==========================================================================
// Quyết định (đã thống nhất với người dùng): GIỮ field phẳng (không lồng
// content/style/asset như gợi ý trong checklist) để tránh phải sửa lại toàn
// bộ renderer/UI đang đọc item.title/item.desc/... trực tiếp — rủi ro cao so
// với lợi ích ở quy mô hiện tại (project <20 ảnh). Đổi lại, file này là NGUỒN
// DUY NHẤT định nghĩa: field nào tồn tại, default là gì, và field nào thuộc
// nhóm nào (ghi rõ bằng comment) — đáp ứng đúng yêu cầu "schema rõ ràng, có
// default value" của checklist mà không cần đổi cấu trúc dữ liệu.
//
// Field nào KHÔNG có trong danh sách dưới đây sẽ không xuất hiện trên object
// trả về — nhờ vậy `normalizeDevice()` cũng đồng thời dọn sạch field lạ khi
// import JSON từ bên ngoài.
// ==========================================================================

// [asset]   — dữ liệu ảnh nhị phân, không phải nội dung/kiểu dáng
import { DEFAULT_FONT_FAMILY, DEFAULT_FRAME_TILT } from '../config/device-specs.js';

const ASSET_FIELDS = ['blob', 'imgElement'];

// [content] — nội dung hiển thị
const CONTENT_FIELDS = ['title', 'desc', 'badge', 'showTitle', 'showDesc', 'showBadge'];

// [style]   — vị trí, kích thước, màu sắc
const STYLE_FIELDS = [
  'titlePos', 'descPos', 'badgePos',
  'titleSize', 'descSize',
  'bgColor', 'bgGradient', 'bgColor2', 'bgGradientAngle', 'bgPattern', 'bgGlow', 'phoneColor',
  'frameLayout', 'frameTilt',
  'titleColor', 'titleUseToken', 'titleColorKey',
  'descColor', 'descUseToken', 'descColorKey',
  'badgeBg', 'badgeBgUseToken', 'badgeBgKey',
  'badgeColor', 'badgeColorUseToken', 'badgeColorKey',
  'fontFamily', 'textShadow',
];

const ALL_FIELDS = ['id', ...ASSET_FIELDS, ...CONTENT_FIELDS, ...STYLE_FIELDS];

function defaultDevice() {
  return {
    id: null,
    blob: null,
    imgElement: null,
    showTitle: true,
    showDesc: true,
    showBadge: true,
    title: '',
    desc: '',
    badge: 'HOT',
    titlePos: 'top-left',
    descPos: 'bottom-center',
    badgePos: 'top-right',
    titleSize: 64,
    descSize: 36,
    bgColor: '#1E293B',
    bgGradient: false,
    bgColor2: '#0F172A',
    bgGradientAngle: 180,
    bgPattern: 'none',
    bgGlow: false,
    phoneColor: '#000000',
    frameLayout: 'straight',
    frameTilt: DEFAULT_FRAME_TILT,
    fontFamily: DEFAULT_FONT_FAMILY,
    textShadow: false,
    titleColor: '#FFFFFF', titleUseToken: false, titleColorKey: null,
    descColor: '#FFFFFF', descUseToken: false, descColorKey: null,
    badgeBg: '#3B82F6', badgeBgUseToken: false, badgeBgKey: null,
    badgeColor: '#FFFFFF', badgeColorUseToken: false, badgeColorKey: null,
  };
}

// Tạo 1 device mới, merge default + overrides (id bắt buộc phải truyền qua overrides).
export function createDevice(overrides = {}) {
  return { ...defaultDevice(), ...overrides };
}

// Chuẩn hoá 1 object device đến từ nguồn ngoài (import JSON) về đúng schema hiện tại:
// - Điền default cho field còn thiếu (JSON cũ từ bản trước có thể thiếu field mới).
// - Bỏ field lạ không nằm trong schema.
// Chưa xử lý version/migration số lớn (đó là P0.9 — Phase 2 kế tiếp).
export function normalizeDevice(raw) {
  const base = defaultDevice();
  const result = { id: raw.id ?? null };
  for (const field of ALL_FIELDS) {
    if (field === 'id') continue;
    result[field] = field in raw ? raw[field] : base[field];
  }
  return result;
}

export const DEVICE_FIELD_GROUPS = { ASSET_FIELDS, CONTENT_FIELDS, STYLE_FIELDS, ALL_FIELDS };
