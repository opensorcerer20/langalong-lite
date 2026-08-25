/* The one line of feedback under the tile bank.

   It holds its height when empty so nothing below it jumps as the message
   appears and clears, and it is a live region so a screen reader announces the
   verdict without the learner going looking for it. */

import type { DrillStatus } from '../../state/appReducer';
import styles from './StatusLine.module.css';

export interface StatusLineProps {
  readonly status: DrillStatus;
  /** Misses on the current item — the second one changes the wording. */
  readonly misses: number;
  /** Misses at which the grammar note appears. See NOTE_AFTER_MISSES. */
  readonly noteAfterMisses: number;
}

/** The message and its ink for each settled status. `wrong` depends on misses. */
const MESSAGES: Record<Exclude<DrillStatus, 'wrong'>, readonly [string, string]> = {
  idle: ['', 'var(--color-neutral-600)'],
  right: ['Correct', 'var(--color-text)'],
  shown: ['Answer shown', 'var(--color-neutral-700)'],
};

export function StatusLine({ status, misses, noteAfterMisses }: StatusLineProps) {
  const [text, color] =
    status === 'wrong'
      ? [
          /* Once the note is on screen, point at it rather than repeating
             "try again" with no new information. */
          misses >= noteAfterMisses ? 'Not yet — read the note' : 'Not quite. Try again.',
          'var(--color-accent-700)',
        ]
      : MESSAGES[status];

  return (
    <div className={styles.status} style={{ color }} role="status" aria-live="polite">
      {text}
    </div>
  );
}
