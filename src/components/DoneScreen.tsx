/* A set is over. The score is answers given on the first try — not answers
   given — so revealing an answer or missing once does not count.

   The copy is props with the sentence drill's wording as defaults, because
   every exercise mode ends here and they do not all finish "sentences". The
   score itself never varies: a first-try count out of a total is what the
   reducer keeps for any exercise, so it stays the fixed part of the layout. */

import * as stylex from '@stylexjs/stylex';

import { shared } from '../styles/shared';

export interface DoneScreenProps {
  /** Answers given with no prior miss. */
  readonly firstTry: number;
  readonly total: number;
  /** The label above the score. */
  readonly title?: string;
  /** The line beneath the score, naming what was counted. */
  readonly scoreLabel?: string;
  /** The paragraph below the rule. */
  readonly body?: string;
  readonly onRestart: () => void;
  readonly onHome: () => void;
}

export function DoneScreen({
  firstTry,
  total,
  title = 'Set complete',
  scoreLabel = 'built first try',
  body = 'Only sentences built without a miss count towards that score. Replaying a set is how it goes up.',
  onRestart,
  onHome,
}: DoneScreenProps) {
  return (
    <section {...stylex.props(shared.screen, s.done)}>
      <div {...stylex.props(shared.kicker, shared.kickerTight)}>{title}</div>
      <div {...stylex.props(s.score)}>
        {firstTry} / {total}
      </div>
      <div {...stylex.props(s.sub)}>{scoreLabel}</div>

      <hr className="hr" />

      <p {...stylex.props(s.body)}>{body}</p>

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
