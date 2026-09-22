import { $ } from '../utils/dom.js';
import { sanitizeFileName } from '../utils/file.js';
import { isCocCocBrowser } from '../utils/browser.js';
import { showToast } from './toast.js';

// --- MODAL ĐẶT TÊN FILE & CHỌN TẢI VỀ MÁY / CHIA SẺ (Web Share API) ---
// Dùng chung cho cả Export ZIP, Export JSON, và xuất PNG từng thiết bị.
let exportFileModalInstance = null;
let pendingExportBlob = null;
let pendingExportExt = 'zip';
let pendingExportMime = 'application/zip';

function clearPendingExport() {
  pendingExportBlob = null;
  pendingExportExt = 'zip';
  pendingExportMime = 'application/zip';
}

// navigator.canShare() chỉ cho biết Web Share API CÓ THỂ hỗ trợ dữ liệu này, KHÔNG đảm bảo
// navigator.share() thực tế chắc chắn thành công (còn phụ thuộc OS/Share Sheet/app nhận file).
function canShareFile(blob, ext, mimeType) {
  if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
  try {
    return navigator.canShare({ files: [new File([blob], `test.${ext}`, { type: mimeType })] });
  } catch (error) {
    console.warn('[Web Share] canShare() lỗi:', error);
    return false; // 1 số trình duyệt lạ (vd Cốc Cốc) throw thay vì trả false
  }
}

export function openExportFileModal(blob, suggestedName, ext, mimeType, modalTitle) {
  pendingExportBlob = blob;
  pendingExportExt = ext;
  pendingExportMime = mimeType;
  $('exportFileModalLabel').textContent = modalTitle;
  $('exportFileFilename').value = suggestedName;
  $('exportFileExtSuffix').textContent = '.' + ext;

  // Web Share API cho file chỉ chạy được ở HTTPS/localhost & một số trình duyệt (chủ yếu mobile).
  // Kiểm tra trước để ẩn nút Chia sẻ nếu máy/trình duyệt hiện tại không hỗ trợ, tránh bấm vào là lỗi.
  let canShareFiles = canShareFile(blob, ext, mimeType);
  if (!canShareFiles) {
    // Một số trình duyệt (đặc biệt Safari/WebKit trên iOS) từ chối canShare() với MIME type
    // cụ thể như application/zip, application/json — thử lại với MIME type nhị phân chung
    // (application/octet-stream) trước khi kết luận không hỗ trợ, tránh ẩn nhầm nút Chia sẻ
    // trên máy thực ra vẫn chia sẻ được (xem thêm ghi chú ở nút Chia sẻ bên dưới).
    canShareFiles = canShareFile(blob, ext, 'application/octet-stream');
  }

  // Đã xác nhận thực tế: Cốc Cốc chỉ chia sẻ được file media (ảnh/video/audio) qua Web Share
  // API, luôn từ chối file dữ liệu (.zip/.json) dù canShare() báo true và đã thử cả MIME type
  // application/octet-stream. Ẩn sẵn nút Chia sẻ cho các file không phải media trên trình
  // duyệt này để người dùng không phải bấm thử rồi mới biết lỗi.
  const isMediaType = /^(image|video|audio)\//.test(mimeType);
  if (canShareFiles && isCocCocBrowser() && !isMediaType) {
    canShareFiles = false;
  }

  $('exportFileShareBtn').classList.toggle('d-none', !canShareFiles);
  $('exportFileShareNote').classList.toggle('d-none', canShareFiles);

  if (!exportFileModalInstance) {
    exportFileModalInstance = new bootstrap.Modal($('exportFileModal'));
  }
  exportFileModalInstance.show();
}

export function initExportModal() {
  $('exportFileDownloadBtn').addEventListener('click', () => {
    if (!pendingExportBlob) return;
    const fileName = sanitizeFileName($('exportFileFilename').value);
    saveAs(pendingExportBlob, `${fileName}.${pendingExportExt}`);
    exportFileModalInstance.hide();
    clearPendingExport();
  });

  $('exportFileShareBtn').addEventListener('click', async () => {
    if (!pendingExportBlob) return;
    const fileName = sanitizeFileName($('exportFileFilename').value);
    const fullFileName = `${fileName}.${pendingExportExt}`;

    const tryShare = (mimeType) => {
      const file = new File([pendingExportBlob], fullFileName, { type: mimeType });
      return navigator.share({ files: [file], title: fileName, text: 'Store screenshots' });
    };

    try {
      await tryShare(pendingExportMime);
      exportFileModalInstance.hide();
      clearPendingExport();
    } catch (err) {
      // Người dùng bấm Huỷ ở hộp thoại chia sẻ của hệ điều hành -> không phải lỗi, bỏ qua im lặng
      if (err.name === 'AbortError') return;

      if (err.name === 'NotAllowedError') {
        // canShare() chỉ kiểm tra API có tồn tại, KHÔNG đảm bảo chia sẻ thật sự thành công.
        // Safari/WebKit (chủ yếu iOS) hay từ chối MIME type cụ thể như application/zip,
        // application/json dù canShare() báo hỗ trợ — thử lại 1 lần với MIME type nhị phân
        // chung (application/octet-stream); vẫn giữ nguyên đuôi .zip/.json trên tên file nên
        // hệ thống/app nhận vẫn nhận diện đúng loại file. Nếu vẫn lỗi thì đúng là hệ điều hành/
        // trình duyệt không có nơi nào đăng ký nhận loại file này (hay gặp .zip trên Desktop) —
        // giới hạn của nền tảng, không sửa được từ phía web, chỉ còn "Tải về máy".
        try {
          await tryShare('application/octet-stream');
          exportFileModalInstance.hide();
          clearPendingExport();
          return;
        } catch (retryErr) {
          if (retryErr.name === 'AbortError') return;
          console.error(retryErr);
        }
        showToast(`⚠ Trình duyệt/thiết bị này không hỗ trợ chia sẻ file .${pendingExportExt} qua Chia sẻ hệ thống (hay gặp với .zip trên máy tính).\nVui lòng bấm "⬇ Tải về máy" thay thế.`, 'danger');
      } else {
        console.error(err);
        showToast('❌ Không thể chia sẻ file: ' + (err.message || 'Lỗi không xác định.'), 'danger');
      }
    }
  });
}

export function resetExportFileModal() {
  clearPendingExport();
  if (exportFileModalInstance) exportFileModalInstance.hide();
}
