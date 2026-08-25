/* The grammar explanation.

   Same note, two jobs: after a second miss it is the help that unblocks the
   learner, and after a correct answer it is a footnote on what they just got
   right. Only the label changes. */

import styles from './GrammarNote.module.css';

export interface GrammarNoteProps {
  readonly note: string;
  /**
   * The answer is settled, so the note is read as commentary rather than as
   * help — which is what the label says.
   */
  readonly done: boolean;
}

export function GrammarNote({ note, done }: GrammarNoteProps) {
  return (
    <aside className={styles.note}>
      <div className={styles.label}>{done ? 'Additional grammar tips' : 'Grammar'}</div>
      <p className={styles.body}>{note}</p>
    </aside>
  );
}
