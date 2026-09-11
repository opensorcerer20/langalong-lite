/* The header bar: the way back, the wordmark, and where you are.

   The back link only exists inside a drill; on the home screen there is nowhere
   to go back to. */

import * as stylex from '@stylexjs/stylex';

export interface HeaderProps {
  /** The right-hand label — the language on home, the situation in a drill. */
  readonly label: string;
  /**
   * A standing condition worth admitting, drawn beside the label. Today that is
   * only "progress is not being saved"; see App. Omitted, nothing is drawn —
   * this is not a place for transient messages, which the status line owns.
   */
  readonly notice?: string | undefined;
  /** Omitted on the home screen, where there is no back. */
  readonly onBack?: (() => void) | undefined;
}

export function Header({ label, notice, onBack }: HeaderProps) {
  return (
    <header {...stylex.props(s.header)}>
      <div {...stylex.props(s.left)}>
        {onBack && (
          <button type="button" {...stylex.props(s.back)} onClick={onBack}>
            &larr; All
          </button>
        )}
        <div {...stylex.props(s.brand)}>TSUMIKI</div>
      </div>
      <div {...stylex.props(s.right)}>
        <span>{label}</span>
        {/* Not a live region. Durability is resolved before the first render —
            see main.tsx — so this never appears mid-session, and the drill's
            status line is already the one thing here that announces. */}
        {notice !== undefined && <span {...stylex.props(s.notice)}>{notice}</span>}
      </div>
    </header>
  );
}

const s = stylex.create({
  header: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    /* Clears the status bar when installed and running standalone. */
    paddingTop: 'calc(18px + env(safe-area-inset-top))',
    paddingRight: 20,
    paddingBottom: 14,
    paddingLeft: 20,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
  },

  left: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 12,
  },

  right: {
    display: 'flex',
    gap: 10,
    alignItems: 'baseline',
    fontSize: 12,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-neutral-700)',
  },

  back: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderStyle: 'none',
    padding: 0,
    cursor: 'pointer',
    fontSize: 12,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 600,
    color: {
      default: 'var(--color-accent-700)',
      ':hover': 'var(--color-accent)',
    },
  },

  brand: {
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-text)',
  },

  /* The accent, as a warning rather than as decoration — it is the one thing in
     the header a learner is meant to notice. */
  notice: {
    color: 'var(--color-accent-700)',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
});
