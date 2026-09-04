/* The English sentence to build, and where the learner is in the set. */

import * as stylex from '@stylexjs/stylex';

import { shared } from '../styles/shared';

export interface PromptBandProps {
  /** The English prompt. */
  readonly prompt: string;
  /** The new language's name in English, for the kicker. */
  readonly language: string;
  /** Zero-based index of the current item. */
  readonly index: number;
  readonly total: number;
}

export function PromptBand({ prompt, language, index, total }: PromptBandProps) {
  return (
    <div {...stylex.props(s.band)}>
      <div {...stylex.props(shared.kicker)}>
        Say this in {language} — item {index + 1} of {total}
      </div>
      <h1 {...stylex.props(s.prompt)}>{prompt}</h1>
    </div>
  );
}

const s = stylex.create({
  band: {
    paddingTop: 22,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
  },

  prompt: {
    marginTop: 0,
    marginBottom: 0,
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: 27,
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
    color: 'var(--color-text)',
    textWrap: 'pretty',
  },
});
