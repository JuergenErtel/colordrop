'use strict';

import * as cafe         from './backgrounds/cafe.js';
import * as kirschbluete from './backgrounds/kirschbluete.js';
import * as garden       from './backgrounds/garden.js';
import * as rooftop      from './backgrounds/rooftop.js';
import * as winter       from './backgrounds/winter.js';

// Re-export geometry + colour helpers so existing consumers (room-decor*.js)
// keep working without import-path changes.
export {
  FLOOR_Y, TABLE_CX, TABLE_CY, TABLE_RX, TABLE_RY,
  lerpHSL, themeCenter,
} from './backgrounds/_shared.js';

export function drawBackground(ctx, ts, theme, prevTheme, fade, bgId) {
  switch (bgId) {
    case 'garden':       return garden.draw(ctx, ts, theme);
    case 'rooftop':      return rooftop.draw(ctx, ts, theme);
    case 'winter':       return winter.draw(ctx, ts, theme);
    case 'kirschbluete': return kirschbluete.draw(ctx, ts, theme);
    default:             return cafe.draw(ctx, ts, theme, prevTheme, fade);
  }
}
