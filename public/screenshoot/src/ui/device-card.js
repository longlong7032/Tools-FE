import { renderColorControlHtml } from './color-control.js';
import { escapeHtml } from '../utils/html.js';
import { GRADIENT_PRESETS, FONT_OPTIONS, BG_PATTERN_OPTIONS, THEME_PRESETS, FRAME_LAYOUT_OPTIONS } from '../config/device-specs.js';

// Sinh toàn bộ HTML cho 1 thẻ thiết bị (accordion-item) — tách khỏi buildDeviceUI() theo P0.3/P0.5,
// để device-list.js chỉ lo việc lặp danh sách + gắn event delegation, không lo dựng HTML.
export function buildDeviceCardHtml(item, idx) {
  // P0.11 — title/desc/badge là nội dung người dùng tự nhập (hoặc đến từ JSON import, coi
  // như nguồn ngoài không đáng tin) và bị nhét thẳng vào innerHTML bên dưới -> phải escape.
  // Các field còn lại (pos/size/màu hex) là enum/số nội bộ do UI tự sinh, không cần escape.
  const safeTitle = escapeHtml(item.title);
  const safeDesc = escapeHtml(item.desc);
  const safeBadge = escapeHtml(item.badge);

  return `
      <h2 class="accordion-header p-3">
        <button class="accordion-button fw-bold p-3" type="button" data-bs-toggle="collapse" data-bs-target="#collapse_${item.id}">
          📱 Thiết bị #${idx + 1}
        </button>
      </h2>
      <div id="collapse_${item.id}" class="accordion-collapse collapse show">
        <div class="accordion-body p-3 p-md-4">

          <div class="row g-4">
            <div class="col-lg-6">
              <div class="canvas-hover-wrap rounded-4">
                <div class="bg-body-secondary rounded-4 p-3 d-flex justify-content-center align-items-center">
                  <canvas id="canvas_${item.id}" width="1080" height="1920" class="mw-100 rounded-3 shadow bg-white" style="max-height: calc(100vh - 2rem);"></canvas>
                </div>

                <!-- Floating action toolbar — ẩn mặc định, hiện khi hover/focus vào vùng preview
                     (xem .canvas-hover-wrap/.canvas-floating-toolbar trong design-system.css) để
                     thao tác nhanh ngay sát khung máy thay vì 1 hàng nút tĩnh chiếm chỗ phía trên.
                     Mỗi nút chỉ có icon -> dùng aria-label (đọc được cho a11y) + data-tooltip
                     (nhãn ngắn hiển thị bằng CSS ::after khi hover/focus, xem design-system.css)
                     thay vì "title" — "title" sẽ hiện tooltip GỐC của trình duyệt (chậm, xấu,
                     không đồng bộ style) chồng lên tooltip tự vẽ, gây lặp 2 tooltip cùng lúc. -->
                <div class="canvas-floating-toolbar">
                  <button type="button" class="canvas-toolbar-btn btn-copy-style" data-id="${item.id}"
                    aria-label="Copy Tiêu đề/Mô tả/Badge (nội dung, vị trí, cỡ chữ, màu)" data-tooltip="Copy Tiêu đề/Mô tả/Badge">📋</button>
                  <button type="button" class="canvas-toolbar-btn btn-change-image" data-id="${item.id}"
                    aria-label="Đổi ảnh (giữ nguyên Tiêu đề/Mô tả/Badge/vị trí)" data-tooltip="Đổi ảnh">🖼</button>
                  <button type="button" class="canvas-toolbar-btn btn-paste-style" data-id="${item.id}"
                    aria-label="Dán Tiêu đề/Mô tả/Badge từ Clipboard (ghi đè nội dung hiện tại)" data-tooltip="Dán style đã copy">📥</button>
                  <button type="button" class="canvas-toolbar-btn btn-apply-style-all" data-id="${item.id}"
                    aria-label="Áp Nền/Gradient/Hoạ tiết/Font/Glow của thiết bị này cho TẤT CẢ thiết bị khác" data-tooltip="Áp style cho tất cả">🪄</button>
                  <button type="button" class="canvas-toolbar-btn btn-random-single-pos" data-id="${item.id}"
                    aria-label="Random Vị trí" data-tooltip="Random vị trí">🎲</button>
                  <span class="canvas-toolbar-divider"></span>
                  <button type="button" class="canvas-toolbar-btn download-single-btn" data-id="${item.id}"
                    aria-label="Xuất ảnh này" data-tooltip="Xuất ảnh này">⬇</button>
                  <button type="button" class="canvas-toolbar-btn canvas-toolbar-btn-danger btn-delete-single" data-id="${item.id}"
                    aria-label="Xoá thiết bị này" data-tooltip="Xoá thiết bị">🗑</button>
                </div>

                <input type="file" class="d-none ctrl-change-image-input" data-id="${item.id}"
                  accept="image/png, image/jpeg, image/webp">
              </div>
            </div>

            <div class="col-lg-6">
              <div class="p-3 bg-light rounded-3 mb-3 border">
                <label class="form-label small mb-2 fw-bold">🎭 Theme trọn gói</label>
                <div class="d-flex flex-wrap gap-2">
                  ${THEME_PRESETS.map((t) => `
                    <button type="button" class="ctrl-theme-preset btn btn-sm btn-outline-secondary d-flex align-items-center gap-2 py-1"
                      data-id="${item.id}" data-theme="${t.key}" title="Áp Theme ${escapeHtml(t.name)}">
                      <span style="display:inline-block;width:16px;height:16px;border-radius:50%;flex:none;
                        background:${t.bgGradient ? `linear-gradient(${t.bgGradientAngle}deg, ${t.bgColor}, ${t.bgColor2})` : t.bgColor};
                        border:1px solid rgba(127,127,127,.35);"></span>
                      <span>${escapeHtml(t.name)}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              <div class="p-3 bg-light rounded-3 mb-3 border" id="bgPanel_${item.id}">
                <label class="form-label small mb-2 fw-bold d-block">🎨 Nền, Hiệu ứng &amp; Font</label>

                <div class="d-flex flex-wrap gap-3 mb-3">
                  <div class="text-center">
                    <input type="color" class="color-swatch ctrl-color-bg" data-id="${item.id}" value="${item.bgColor}" title="Màu nền Canvas${item.bgGradient ? ' (1)' : ''}">
                    <div class="small text-monochrome-muted mt-1">Nền${item.bgGradient ? ' 1' : ''}</div>
                  </div>
                  <div class="text-center">
                    <input type="color" class="color-swatch ctrl-color-phone" data-id="${item.id}" value="${item.phoneColor}" title="Màu vỏ máy">
                    <div class="small text-monochrome-muted mt-1">Vỏ máy</div>
                  </div>
                </div>

                <div class="d-flex flex-wrap gap-2 mb-3">
                  <input type="checkbox" class="btn-check ctrl-toggle-bg-gradient" id="toggleBgGradient_${item.id}" data-id="${item.id}" ${item.bgGradient ? 'checked' : ''}>
                  <label class="btn btn-sm btn-outline-dark" for="toggleBgGradient_${item.id}">🎨 Gradient</label>

                  <input type="checkbox" class="btn-check ctrl-toggle-bg-glow" id="toggleBgGlow_${item.id}" data-id="${item.id}" ${item.bgGlow ? 'checked' : ''}>
                  <label class="btn btn-sm btn-outline-dark" for="toggleBgGlow_${item.id}">✨ Glow</label>

                  <input type="checkbox" class="btn-check ctrl-toggle-text-shadow" id="toggleTextShadow_${item.id}" data-id="${item.id}" ${item.textShadow ? 'checked' : ''}>
                  <label class="btn btn-sm btn-outline-dark" for="toggleTextShadow_${item.id}">🔤 Đổ bóng chữ</label>
                </div>

                <div class="ctrl-bg-gradient-group ${item.bgGradient ? '' : 'd-none'} mb-3">
                  <div class="d-flex flex-wrap align-items-end gap-3 mb-2">
                    <div class="text-center">
                      <input type="color" class="color-swatch ctrl-color-bg2" data-id="${item.id}" value="${item.bgColor2}" title="Màu nền Canvas (2)">
                      <div class="small text-monochrome-muted mt-1">Nền 2</div>
                    </div>
                    <div class="flex-grow-1" style="min-width: 180px;">
                      <div class="form-floating">
                        <select class="form-select ctrl-bg-gradient-angle" id="bgGradientAngle_${item.id}" data-id="${item.id}">
                          <option value="180" ${item.bgGradientAngle === 180 ? 'selected' : ''}>↓ Trên xuống dưới</option>
                          <option value="0" ${item.bgGradientAngle === 0 ? 'selected' : ''}>↑ Dưới lên trên</option>
                          <option value="90" ${item.bgGradientAngle === 90 ? 'selected' : ''}>→ Trái sang phải</option>
                          <option value="270" ${item.bgGradientAngle === 270 ? 'selected' : ''}>← Phải sang trái</option>
                          <option value="135" ${item.bgGradientAngle === 135 ? 'selected' : ''}>↘ Chéo trên trái → dưới phải</option>
                          <option value="225" ${item.bgGradientAngle === 225 ? 'selected' : ''}>↙ Chéo trên phải → dưới trái</option>
                        </select>
                        <label for="bgGradientAngle_${item.id}">Hướng Gradient</label>
                      </div>
                    </div>
                  </div>
                  <label class="form-label small mb-1 text-monochrome-muted">✨ Preset màu đẹp</label>
                  <div class="d-flex flex-wrap gap-2">
                    ${GRADIENT_PRESETS.map((p) => `
                      <button type="button" class="ctrl-gradient-preset p-0 border" data-id="${item.id}"
                        data-from="${p.from}" data-to="${p.to}" data-angle="${p.angle}" title="${escapeHtml(p.name)}"
                        style="width:26px;height:26px;border-radius:50%;background:linear-gradient(${p.angle}deg, ${p.from}, ${p.to});"></button>
                    `).join('')}
                  </div>
                </div>

                <div class="row g-2">
                  <div class="col-6">
                    <div class="form-floating">
                      <select class="form-select ctrl-bg-pattern" id="bgPattern_${item.id}" data-id="${item.id}">
                        ${BG_PATTERN_OPTIONS.map((p) => `<option value="${p.value}" ${item.bgPattern === p.value ? 'selected' : ''}>${p.label}</option>`).join('')}
                      </select>
                      <label for="bgPattern_${item.id}">Hoạ tiết nền</label>
                    </div>
                  </div>
                  <div class="col-6">
                    <div class="form-floating">
                      <select class="form-select ctrl-font-family" id="fontFamily_${item.id}" data-id="${item.id}">
                        ${FONT_OPTIONS.map((f) => `<option value="${escapeHtml(f.family)}" ${item.fontFamily === f.family ? 'selected' : ''}>${escapeHtml(f.label)}</option>`).join('')}
                      </select>
                      <label for="fontFamily_${item.id}">Font chữ</label>
                    </div>
                  </div>
                </div>

                <div class="row g-2 mt-1">
                  <div class="col-6">
                    <div class="form-floating">
                      <select class="form-select ctrl-frame-layout" id="frameLayout_${item.id}" data-id="${item.id}">
                        ${FRAME_LAYOUT_OPTIONS.map((f) => `<option value="${f.value}" ${item.frameLayout === f.value ? 'selected' : ''}>${f.label}</option>`).join('')}
                      </select>
                      <label for="frameLayout_${item.id}">Kiểu khung</label>
                    </div>
                  </div>
                  <div class="col-6 ctrl-frame-tilt-group ${item.frameLayout === 'tilted' ? '' : 'd-none'}">
                    <div class="form-floating">
                      <input type="number" class="form-control ctrl-frame-tilt" id="frameTilt_${item.id}" data-id="${item.id}" value="${item.frameTilt}" min="-25" max="25" step="1">
                      <label for="frameTilt_${item.id}">Góc nghiêng (độ)</label>
                    </div>
                  </div>
                </div>
              </div>

              <ul class="nav nav-pills nav-fill mb-3">
                <li class="nav-item">
                  <button class="nav-link active" data-bs-toggle="pill" data-bs-target="#pane-title-${item.id}" type="button">🔤 Tiêu đề</button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" data-bs-toggle="pill" data-bs-target="#pane-desc-${item.id}" type="button">📝 Mô tả</button>
                </li>
                <li class="nav-item">
                  <button class="nav-link" data-bs-toggle="pill" data-bs-target="#pane-badge-${item.id}" type="button">🏷 Badge</button>
                </li>
              </ul>

              <div class="tab-content">
                <!-- TAB TIÊU ĐỀ -->
                <div class="tab-pane fade show active" id="pane-title-${item.id}">
                  <div class="form-check form-switch mb-3">
                    <input class="form-check-input ctrl-toggle-title" type="checkbox" id="toggleTitle_${item.id}" data-id="${item.id}" ${item.showTitle ? 'checked' : ''}>
                    <label class="form-check-label fw-bold text-primary" for="toggleTitle_${item.id}">Hiển thị Tiêu đề</label>
                  </div>
                  <div class="ctrl-title-group ${item.showTitle ? '' : 'd-none'}">
                    <div class="form-floating mb-3">
                      <input type="text" class="form-control ctrl-title" id="titleInput_${item.id}" data-id="${item.id}" value="${safeTitle}" placeholder="Tiêu đề">
                      <label for="titleInput_${item.id}">Nội dung Tiêu đề</label>
                    </div>
                    <div class="row g-2">
                      <div class="col-6">
                        <div class="form-floating">
                          <select class="form-select ctrl-title-pos" id="titlePos_${item.id}" data-id="${item.id}">
                            <option value="top-left" ${item.titlePos === 'top-left' ? 'selected' : ''}>↖ Lề trên trái</option>
                            <option value="top-center" ${item.titlePos === 'top-center' ? 'selected' : ''}>↑ Lề trên giữa</option>
                            <option value="top-right" ${item.titlePos === 'top-right' ? 'selected' : ''}>↗ Lề trên phải</option>
                            <option value="bottom-left" ${item.titlePos === 'bottom-left' ? 'selected' : ''}>↙ Lề dưới trái</option>
                            <option value="bottom-center" ${item.titlePos === 'bottom-center' ? 'selected' : ''}>↓ Lề dưới giữa</option>
                            <option value="bottom-right" ${item.titlePos === 'bottom-right' ? 'selected' : ''}>↘ Lề dưới phải</option>
                          </select>
                          <label for="titlePos_${item.id}">Vị trí</label>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="form-floating">
                          <input type="number" class="form-control ctrl-title-size" id="titleSize_${item.id}" data-id="${item.id}" value="${item.titleSize}" placeholder="Cỡ chữ">
                          <label for="titleSize_${item.id}">Cỡ chữ (px)</label>
                        </div>
                      </div>
                      <div class="col-12" id="ctrl_wrap_${item.id}_titleColor" data-label="Màu chữ">
                        ${renderColorControlHtml(item.id, 'titleColor', 'Màu chữ', item.titleColor, item.titleUseToken, item.titleColorKey)}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TAB MÔ TẢ -->
                <div class="tab-pane fade" id="pane-desc-${item.id}">
                  <div class="form-check form-switch mb-3">
                    <input class="form-check-input ctrl-toggle-desc" type="checkbox" id="toggleDesc_${item.id}" data-id="${item.id}" ${item.showDesc ? 'checked' : ''}>
                    <label class="form-check-label fw-bold text-primary" for="toggleDesc_${item.id}">Hiển thị Mô tả ngắn</label>
                  </div>
                  <div class="ctrl-desc-group ${item.showDesc ? '' : 'd-none'}">
                    <div class="form-floating mb-3">
                      <textarea class="form-control ctrl-desc" id="descInput_${item.id}" data-id="${item.id}" rows="3" placeholder="Mô tả" style="height: 100px;">${safeDesc}</textarea>
                      <label for="descInput_${item.id}">Nội dung Mô tả</label>
                    </div>
                    <div class="row g-2">
                      <div class="col-6">
                        <div class="form-floating">
                          <select class="form-select ctrl-desc-pos" id="descPos_${item.id}" data-id="${item.id}">
                            <option value="top-left" ${item.descPos === 'top-left' ? 'selected' : ''}>↖ Lề trên trái</option>
                            <option value="top-center" ${item.descPos === 'top-center' ? 'selected' : ''}>↑ Lề trên giữa</option>
                            <option value="top-right" ${item.descPos === 'top-right' ? 'selected' : ''}>↗ Lề trên phải</option>
                            <option value="bottom-left" ${item.descPos === 'bottom-left' ? 'selected' : ''}>↙ Lề dưới trái</option>
                            <option value="bottom-center" ${item.descPos === 'bottom-center' ? 'selected' : ''}>↓ Lề dưới giữa</option>
                            <option value="bottom-right" ${item.descPos === 'bottom-right' ? 'selected' : ''}>↘ Lề dưới phải</option>
                          </select>
                          <label for="descPos_${item.id}">Vị trí</label>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="form-floating">
                          <input type="number" class="form-control ctrl-desc-size" id="descSize_${item.id}" data-id="${item.id}" value="${item.descSize}" placeholder="Cỡ chữ">
                          <label for="descSize_${item.id}">Cỡ chữ (px)</label>
                        </div>
                      </div>
                      <div class="col-12" id="ctrl_wrap_${item.id}_descColor" data-label="Màu chữ">
                        ${renderColorControlHtml(item.id, 'descColor', 'Màu chữ', item.descColor, item.descUseToken, item.descColorKey)}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TAB BADGE -->
                <div class="tab-pane fade" id="pane-badge-${item.id}">
                  <div class="form-check form-switch mb-3">
                    <input class="form-check-input ctrl-toggle-badge" type="checkbox" id="toggleBadge_${item.id}" data-id="${item.id}" ${item.showBadge ? 'checked' : ''}>
                    <label class="form-check-label fw-bold text-primary" for="toggleBadge_${item.id}">Hiển thị Badge</label>
                  </div>
                  <div class="ctrl-badge-group ${item.showBadge ? '' : 'd-none'}">
                    <div class="row g-2 mb-2">
                      <div class="col-6">
                        <div class="form-floating">
                          <input type="text" class="form-control ctrl-badge" id="badgeInput_${item.id}" data-id="${item.id}" value="${safeBadge}" placeholder="Badge">
                          <label for="badgeInput_${item.id}">Badge Text</label>
                        </div>
                      </div>
                      <div class="col-6">
                        <div class="form-floating">
                          <select class="form-select ctrl-badge-pos" id="badgePos_${item.id}" data-id="${item.id}">
                            <option value="top-left" ${item.badgePos === 'top-left' ? 'selected' : ''}>↖ Lề trên trái</option>
                            <option value="top-right" ${item.badgePos === 'top-right' ? 'selected' : ''}>↗ Lề trên phải</option>
                            <option value="bottom-left" ${item.badgePos === 'bottom-left' ? 'selected' : ''}>↙ Lề dưới trái</option>
                            <option value="bottom-right" ${item.badgePos === 'bottom-right' ? 'selected' : ''}>↘ Lề dưới phải</option>
                          </select>
                          <label for="badgePos_${item.id}">Vị trí</label>
                        </div>
                      </div>
                    </div>
                    <div class="row g-2">
                      <div class="col-6" id="ctrl_wrap_${item.id}_badgeBg" data-label="Nền Badge">
                        ${renderColorControlHtml(item.id, 'badgeBg', 'Nền Badge', item.badgeBg, item.badgeBgUseToken, item.badgeBgKey)}
                      </div>
                      <div class="col-6" id="ctrl_wrap_${item.id}_badgeColor" data-label="Chữ Badge">
                        ${renderColorControlHtml(item.id, 'badgeColor', 'Chữ Badge', item.badgeColor, item.badgeColorUseToken, item.badgeColorKey)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    `;
}

export function emptyStateHtml() {
  return `
      <div class="card border-0 rounded-4 shadow-sm p-5 text-center text-secondary">
        <h5>Chưa có dữ liệu Preview</h5>
        <p class="mb-0">Tải ảnh lên ở Bước 3 hoặc bấm <strong>Import JSON</strong> để khôi phục cấu hình làm việc.</p>
      </div>
    `;
}
