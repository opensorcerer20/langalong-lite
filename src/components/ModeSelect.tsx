/* Free learning or timed, chosen on the home screen before opening a situation.

   The design system's `.seg` control on native radios — only the container is
   StyleX. */

import * as stylex from '@stylexjs/stylex';

import type { DrillMode } from '../state/appReducer';
import { MODE_LABELS } from './modeLabels';

export interface ModeSelectProps {
  readonly mode: DrillMode;
  readonly onChange: (mode: DrillMode) => void;
}

export function ModeSelect({ mode, onChange }: ModeSelectProps) {
  return (
    <div {...stylex.props(s.wrap)}>
      <div className="seg" role="radiogroup" aria-label="Mode">
        {(Object.keys(MODE_LABELS) as DrillMode[]).map((option) => (
          <label key={option} className="seg-opt">
            <input
              type="radio"
              name="mode"
              value={option}
              checked={mode === option}
              onChange={() => onChange(option)}
            />
            {MODE_LABELS[option]}
          </label>
        ))}
      </div>
    </div>
  );
}

const s = stylex.create({
  wrap: {
    paddingTop: 16,
    paddingRight: 20,
    paddingBottom: 16,
    paddingLeft: 20,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
  },
});
