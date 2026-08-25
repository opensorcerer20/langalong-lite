/* The buttons at the foot of the drill.

   One primary button does both jobs: it checks the answer while the item is
   open, and advances once the answer is settled. The reveal button only appears
   after enough misses — see REVEAL_AFTER_MISSES. */

import styles from './DrillActions.module.css';

export interface DrillActionsProps {
  /** The answer is settled, so the primary button advances instead of checking. */
  readonly done: boolean;
  /** The current item is the last in the set. */
  readonly isLastItem: boolean;
  /** Nothing is on the answer line yet, so there is nothing to check. */
  readonly canCheck: boolean;
  readonly showReveal: boolean;
  readonly onCheck: () => void;
  readonly onNext: () => void;
  readonly onReveal: () => void;
}

export function DrillActions({
  done,
  isLastItem,
  canCheck,
  showReveal,
  onCheck,
  onNext,
  onReveal,
}: DrillActionsProps) {
  const label = done ? (isLastItem ? 'Finish set' : 'Next sentence') : 'Check';

  return (
    <div className={styles.actions}>
      {showReveal && (
        <button type="button" className="btn btn-secondary btn-block" onClick={onReveal}>
          Show me the answer
        </button>
      )}
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!done && !canCheck}
        onClick={done ? onNext : onCheck}
      >
        {label}
      </button>
    </div>
  );
}
