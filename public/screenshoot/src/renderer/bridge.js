// Cầu nối giữa renderer "thuần" (canvas.js — không biết Store/DOM) và phần còn lại của app.
// Đây là chỗ DUY NHẤT gọi initRenderScheduler(); mọi module khác muốn vẽ lại 1 hoặc nhiều
// device thì import renderDeviceById()/renderAllDevices() từ ĐÂY, không import canvas.js trực tiếp.
import { $ } from '../utils/dom.js';
import { store } from '../state/store.js';
import { renderDevice, initRenderScheduler, scheduleRender, scheduleRenderAll } from './canvas.js';

initRenderScheduler((id) => {
  const item = store.getDevice(id);
  const canvas = $(`canvas_${id}`);
  if (item && canvas) renderDevice(canvas, item, store.getDeviceType());
});

export function renderDeviceById(id) {
  scheduleRender(id);
}

export function renderAllDevices() {
  scheduleRenderAll(store.getDevices().map((d) => d.id));
}
