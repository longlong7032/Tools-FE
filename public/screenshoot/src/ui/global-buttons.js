import { $ } from '../utils/dom.js';
import { store } from '../state/store.js';

// Bật/tắt các nút thao tác toàn cục tuỳ theo danh sách thiết bị còn hay rỗng
export function updateGlobalButtonsState() {
  const hasDevices = store.getDevices().length > 0;
  $('exportAllBtn').disabled = !hasDevices;
  $('randomAllPositionsBtn').disabled = !hasDevices;
}
