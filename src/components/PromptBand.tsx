/* The English prompt, and where the learner is in the set.

   The instruction above the prompt is a prop because not every exercise asks
   for the same thing — building a sentence and choosing a missing word are
   different tasks over the same English sentence. It defaults to the sentence
   drill's wording, so the caller that has nothing new to say says nothing. */

import * as stylex from '@stylexjs/stylex';

import { shared } from '../styles/shared';

export interface PromptBandProps {
  /** The English prompt. */
  readonly prompt: string;
  /** The target language's name in English, for the default instruction. */
  readonly language: string;
  /** What to do with the prompt. Defaults to "Say this in <language>". */
  readonly instruction?: string;
  /** Zero-based index of the current item. */
  readonly index: number;
  readonly total: number;
}

export function PromptBand({ prompt, language, instruction, index, total }: PromptBandProps) {
  return (
    <div {...stylex.props(s.band)}>
      <div {...stylex.props(shared.kicker)}>
        {instruction ?? `Say this in ${language}`} — item {index + 1} of {total}
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
