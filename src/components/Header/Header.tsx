/* The header bar: the way back, the wordmark, and where you are.

   The back link only exists inside a drill; on the home screen there is nowhere
   to go back to. */

import styles from './Header.module.css';

export interface HeaderProps {
  /** The right-hand label — the language on home, the situation in a drill. */
  readonly label: string;
  /** The streak. Static chrome for now; nothing is persisted between sessions. */
  readonly streak: string;
  /** Omitted on the home screen, where there is no back. */
  readonly onBack?: (() => void) | undefined;
}

export function Header({ label, streak, onBack }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {onBack && (
          <button type="button" className={styles.back} onClick={onBack}>
            &larr; All
          </button>
        )}
        <div className={styles.brand}>TSUMIKI</div>
      </div>
      <div className={styles.right}>
        <span>{label}</span>
        <span className={styles.streak}>{streak}</span>
      </div>
    </header>
  );
}
