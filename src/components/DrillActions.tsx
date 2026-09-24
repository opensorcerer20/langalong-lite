/* The buttons at the foot of the drill.

   One primary button does every job: it checks the answer while the item is
   open, clears a wrong answer left standing on the line, and advances once the
   answer is settled. The reveal button only appears
   after enough misses — see REVEAL_AFTER_MISSES.

   The buttons themselves are the design system's `.btn` classes, unstyled by
   this component — only their container is StyleX. */

import * as stylex from '@stylexjs/stylex';

export interface DrillActionsProps {
  /** The answer is settled, so the primary button advances instead of checking. */
  readonly done: boolean;
  /** The current item is the last in the set. */
  readonly isLastItem: boolean;
  /** Nothing is on the answer line yet, so there is nothing to check. */
  readonly canCheck: boolean;
  /** A wrong answer is standing on the line, so the primary button clears it instead of checking. */
  readonly canRetry: boolean;
  readonly showReveal: boolean;
  readonly onCheck: () => void;
  readonly onRetry: () => void;
  readonly onNext: () => void;
  readonly onReveal: () => void;
}

export function DrillActions({
  done,
  isLastItem,
  canCheck,
  canRetry,
  showReveal,
  onCheck,
  onRetry,
  onNext,
  onReveal,
}: DrillActionsProps) {
  const label = done
    ? isLastItem
      ? 'Finish set'
      : 'Next sentence'
    : canRetry
      ? 'Try again'
      : 'Check';
  const onPrimary = done ? onNext : canRetry ? onRetry : onCheck;

  return (
    <div {...stylex.props(s.actions)}>
      {showReveal && (
        <button type="button" className="btn btn-secondary btn-block" onClick={onReveal}>
          Show me the answer
        </button>
      )}
      <button
        type="button"
        className="btn btn-primary btn-block"
        disabled={!done && !canCheck}
        onClick={onPrimary}
      >
        {label}
      </button>
    </div>
  );
}

const s = stylex.create({
  actions: {
    paddingTop: 10,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
});
