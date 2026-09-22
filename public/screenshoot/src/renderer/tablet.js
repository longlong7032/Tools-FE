import { FRAME_CONFIGS } from '../config/device-specs.js';
import { renderPhoneTabletFrame } from './phone-tablet-frame.js';

export function renderIOSTablet(ctx, item, geometry) {
  renderPhoneTabletFrame(ctx, item, geometry, FRAME_CONFIGS['ios-tablet']);
}

export function renderAndroidTablet(ctx, item, geometry) {
  renderPhoneTabletFrame(ctx, item, geometry, FRAME_CONFIGS['android-tablet']);
}
