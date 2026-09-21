/* The one line of feedback under the tile bank.

   It holds its height when empty so nothing below it jumps as the message
   appears and clears, and it is a live region so a screen reader announces the
   verdict without the learner going looking for it. */

import * as stylex from '@stylexjs/stylex';

import type { DrillStatus } from '../state/appReducer';

export interface StatusLineProps {
  readonly status: DrillStatus;
  /** Passed in, not worked out here, so a note-less item never promises one. */
  readonly noteOnScreen: boolean;
}

export function StatusLine({ status, noteOnScreen }: StatusLineProps) {
  const text =
    status === 'wrong'
      ? /* Once the note is on screen, point at it rather than repeating
           "try again" with no new information. */
        noteOnScreen
        ? 'Not yet — read the note'
        : 'Not quite. Try again.'
      : MESSAGES[status];

  return (
    <div {...stylex.props(s.status, TONE[status])} role="status" aria-live="polite">
      {text}
    </div>
  );
}

/** What each status says. `wrong` depends on whether the note is showing. */
const MESSAGES: Record<Exclude<DrillStatus, 'wrong'>, string> = {
  idle: '',
  right: 'Correct',
  shown: 'Answer shown',
};

const s = stylex.create({
  status: {
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 12,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    /* Reserved height, so the actions below do not jump as the message changes. */
    minHeight: 22,
    fontWeight: 600,
  },

  idle: { color: 'var(--color-neutral-600)' },
  /* A deep ramp step: the accent itself is not contrasty enough at this size. */
  wrong: { color: 'var(--color-accent-700)' },
  right: { color: 'var(--color-text)' },
  shown: { color: 'var(--color-neutral-700)' },
});

/* `satisfies`, not a type annotation: StyleX types each style by its literal
   value, so one Record type would not fit all four. Still fails the build if a
   status is added without a colour. */
const TONE = {
  idle: s.idle,
  wrong: s.wrong,
  right: s.right,
  shown: s.shown,
} satisfies Record<DrillStatus, unknown>;
