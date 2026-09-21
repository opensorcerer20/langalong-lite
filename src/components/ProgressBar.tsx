/* The rule under the header, filled to show how far through a set the learner
   is. Shows as an empty rule on the home screen. */

import * as stylex from '@stylexjs/stylex';

export interface ProgressBarProps {
  /** How far through the set, 0–1. */
  readonly value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      {...stylex.props(s.track)}
      role="progressbar"
      aria-label="Progress through this set"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Width is the only dynamic value, so it is the only inline style. */}
      <div {...stylex.props(s.fill)} style={{ width: `${percent}%` }} />
    </div>
  );
}

const s = stylex.create({
  track: {
    display: 'flex',
    height: 6,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
  },

  fill: {
    backgroundColor: 'var(--color-accent)',
  },
});
