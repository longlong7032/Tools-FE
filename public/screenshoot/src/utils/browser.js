// Nhận diện trình duyệt Cốc Cốc (Android/Desktop) qua User-Agent — UA của Cốc Cốc luôn
// chứa token "coc_coc_browser". Dùng để né 1 giới hạn cứng đã xác nhận thực tế: Cốc Cốc
// chỉ cho Web Share API chia sẻ file loại media (ảnh/video/audio), chặn file dữ liệu như
// .zip/.json bất kể MIME type gửi lên là gì (đã thử cả application/octet-stream vẫn lỗi) —
// không sửa được từ JS nên chỉ còn cách ẩn sẵn nút Chia sẻ cho loại file này trên trình duyệt đó.
export function isCocCocBrowser() {
  return /coc_coc_browser/i.test(navigator.userAgent || '');
}
