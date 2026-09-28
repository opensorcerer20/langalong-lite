/* Kept out of a component file so the lint rule allows both the home screen and the drill screen to import it. */

import type { DrillMode } from '../state/appReducer';

export const MODE_LABELS: Record<DrillMode, string> = {
  free: 'Free learning',
  timed: 'Timed',
};
