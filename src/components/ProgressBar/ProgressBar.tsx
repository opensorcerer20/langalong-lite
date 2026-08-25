/* The rule under the header, filled to show how far through a set the learner
   is. Shows as an empty rule on the home screen. */

import styles from './ProgressBar.module.css';

export interface ProgressBarProps {
  /** How far through the set, 0–1. */
  readonly value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-label="Progress through this set"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
