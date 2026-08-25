/* Set complete. The score is sentences built on the first try — not sentences
   answered — so revealing an answer or missing once does not count. */

import styles from './DoneScreen.module.css';

export interface DoneScreenProps {
  /** Sentences built with no prior miss. */
  readonly firstTry: number;
  readonly total: number;
  readonly onRestart: () => void;
  readonly onHome: () => void;
}

export function DoneScreen({ firstTry, total, onRestart, onHome }: DoneScreenProps) {
  return (
    <section className={`screen ${styles.done}`}>
      <div className="kicker" style={{ marginBottom: 0 }}>
        Set complete
      </div>
      <div className={styles.score}>
        {firstTry} / {total}
      </div>
      <div className={styles.sub}>built first try</div>

      <hr className="hr" />

      <p className={styles.body}>
        Next set unlocks the response level: a shopkeeper speaks first and you build the reply.
      </p>

      <div className={styles.actions}>
        <button type="button" className="btn btn-primary btn-block" onClick={onRestart}>
          Practise this set again
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={onHome}>
          Choose another situation
        </button>
      </div>
    </section>
  );
}
