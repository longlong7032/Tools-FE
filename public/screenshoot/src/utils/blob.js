// --- CHUYỂN ĐỔI BLOB / BINARY / BASE64 UTILS ---

// 1. Chuyển File/Blob thành HTMLImageElement để vẽ lên Canvas
// P0.12 — revoke Object URL ở CẢ 2 nhánh onload/onerror (trước đây chỉ revoke khi load
// thành công; nếu ảnh lỗi/không decode được thì URL bị treo lại, không bao giờ giải phóng).
export function blobToImage(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url); // Giải phóng bộ nhớ Blob URL sau khi load xong
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url); // Ảnh lỗi cũng phải giải phóng URL, không được bỏ sót
      reject(err);
    };
    img.src = url;
  });
}

// 2. Chuyển Blob thành chuỗi Base64 (để đóng gói vào JSON)
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 3. Chuyển chuỗi Base64 ngược lại thành Blob Binary
export function base64ToBlob(base64, mimeType = 'image/png') {
  const byteCharacters = atob(base64.split(',')[1] || base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers); // Mảng Bytes nhị phân (BYTEA)
  return new Blob([byteArray], { type: mimeType });
}
