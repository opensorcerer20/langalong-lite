/* Set complete. The score is sentences built on the first try — not sentences
   answered — so revealing an answer or missing once does not count. */

import * as stylex from '@stylexjs/stylex';

import { shared } from '../styles/shared';

export interface DoneScreenProps {
  /** Sentences built with no prior miss. */
  readonly firstTry: number;
  readonly total: number;
  readonly onRestart: () => void;
  readonly onHome: () => void;
}

export function DoneScreen({ firstTry, total, onRestart, onHome }: DoneScreenProps) {
  return (
    <section {...stylex.props(shared.screen, s.done)}>
      <div {...stylex.props(shared.kicker, shared.kickerTight)}>Set complete</div>
      <div {...stylex.props(s.score)}>
        {firstTry} / {total}
      </div>
      <div {...stylex.props(s.sub)}>built first try</div>

      <hr className="hr" />

      <p {...stylex.props(s.body)}>
        Next set unlocks the response level: a shopkeeper speaks first and you build the reply.
      </p>

      <div {...stylex.props(s.actions)}>
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

const s = stylex.create({
  done: {
    justifyContent: 'center',
    paddingTop: 28,
    paddingRight: 20,
    paddingBottom: 28,
    paddingLeft: 20,
  },

  score: {
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: 64,
    lineHeight: 1,
    letterSpacing: '-0.03em',
    color: 'var(--color-accent)',
    marginTop: 10,
    marginBottom: 4,
  },

  sub: {
    fontSize: 15,
    color: 'var(--color-text)',
    marginBottom: 22,
  },

  body: {
    fontSize: 14,
    lineHeight: 1.6,
    color: 'var(--color-neutral-700)',
    marginTop: 16,
    marginBottom: 24,
  },

  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
});
