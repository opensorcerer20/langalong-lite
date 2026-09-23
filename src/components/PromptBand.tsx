/* The English sentence to build, and where the learner is in the set. */

import * as stylex from '@stylexjs/stylex';

import type { DrillMode } from '../state/appReducer';
import { shared } from '../styles/shared';
import { MODE_LABELS } from './modeLabels';

export interface PromptBandProps {
  /** The English prompt. */
  readonly prompt: string;
  /** The target language's name in English, for the kicker. */
  readonly language: string;
  /** Zero-based index of the current item. */
  readonly index: number;
  readonly total: number;
  readonly mode: DrillMode;
}

export function PromptBand({ prompt, language, index, total, mode }: PromptBandProps) {
  return (
    <div {...stylex.props(s.band)}>
      <div {...stylex.props(shared.kicker, shared.kickerTight)}>
        Say this in {language} — item {index + 1} of {total}
      </div>
      <div {...stylex.props(s.mode)}>{MODE_LABELS[mode]}</div>
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

  /* Matches the selected option of the home screen's `.seg` control. */
  mode: {
    display: 'inline-block',
    marginTop: 8,
    marginBottom: 12,
    paddingTop: 7,
    paddingRight: 12,
    paddingBottom: 7,
    paddingLeft: 12,
    borderRadius: 'var(--radius-md)',
    fontSize: 13,
    backgroundColor: 'var(--color-accent)',
    color: 'var(--color-bg)',
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
