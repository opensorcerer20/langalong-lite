/* What each mode is called on screen. Not a component file, so the home screen
   and the drill screen can both import it. */

import type { DrillMode } from '../state/appReducer';

export const MODE_LABELS: Record<DrillMode, string> = {
  free: 'Free learning',
  timed: 'Timed',
};
