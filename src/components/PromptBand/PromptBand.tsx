/* The English sentence to build, and where the learner is in the set. */

import styles from './PromptBand.module.css';

export interface PromptBandProps {
  /** The English prompt. */
  readonly prompt: string;
  /** Zero-based index of the current item. */
  readonly index: number;
  readonly total: number;
}

export function PromptBand({ prompt, index, total }: PromptBandProps) {
  return (
    <div className={styles.band}>
      <div className="kicker">
        Say this in Japanese — item {index + 1} of {total}
      </div>
      <h1 className={styles.prompt}>{prompt}</h1>
    </div>
  );
}
