import { FRAME_CONFIGS } from '../config/device-specs.js';
import { renderPhoneTabletFrame } from './phone-tablet-frame.js';

export function renderIOSPhone(ctx, item, geometry) {
  renderPhoneTabletFrame(ctx, item, geometry, FRAME_CONFIGS['ios-phone']);
}

export function renderIOSPhone65(ctx, item, geometry) {
  renderPhoneTabletFrame(ctx, item, geometry, FRAME_CONFIGS['ios-phone-6.5']);
}

export function renderAndroidPhone(ctx, item, geometry) {
  renderPhoneTabletFrame(ctx, item, geometry, FRAME_CONFIGS['android-phone']);
}
