/* The grammar explanation.

   Same note, two jobs: after a second miss it is the help that unblocks the
   learner, and after a correct answer it is a footnote on what they just got
   right. Only the label changes. */

import * as stylex from '@stylexjs/stylex';

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
    <aside {...stylex.props(s.note)}>
      <div {...stylex.props(s.label)}>{done ? 'Additional grammar tips' : 'Grammar'}</div>
      <p {...stylex.props(s.body)}>{note}</p>
    </aside>
  );
}

const s = stylex.create({
  note: {
    marginTop: 6,
    marginRight: 20,
    marginBottom: 16,
    marginLeft: 20,
    borderTopWidth: 2,
    borderTopStyle: 'solid',
    borderTopColor: 'var(--color-accent)',
    backgroundColor: 'var(--color-accent-100)',
    paddingTop: 14,
    paddingRight: 16,
    paddingBottom: 14,
    paddingLeft: 16,
  },

  label: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-accent-700)',
    fontWeight: 600,
    marginBottom: 6,
  },

  body: {
    marginTop: 0,
    marginBottom: 0,
    fontSize: 14,
    lineHeight: 1.5,
    /* A deep ramp step: the accent itself is not contrasty enough for body copy. */
    color: 'var(--color-accent-900)',
  },
});
