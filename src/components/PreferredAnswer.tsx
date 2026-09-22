/* The phrasing the item teaches, shown once an alternate has been taken. */

import * as stylex from '@stylexjs/stylex';

import type { Tile as TileData } from '../data/types';

export interface PreferredAnswerProps {
  /** The item's canonical answer, as tiles. */
  readonly ans: readonly TileData[];
  /** See LanguagePack.joiner. */
  readonly joiner: string;
  readonly showReading?: boolean;
}

export function PreferredAnswer({ ans, joiner, showReading = true }: PreferredAnswerProps) {
  return (
    <aside {...stylex.props(s.panel)}>
      <div {...stylex.props(s.label)}>More natural</div>
      <p {...stylex.props(s.text)}>{ans.map((tile) => tile[0]).join(joiner)}</p>
      {showReading && (
        /* Readings are always spaced, whatever the language joins its text with. */
        <p {...stylex.props(s.reading)}>{ans.map((tile) => tile[1]).join(' ')}</p>
      )}
    </aside>
  );
}

const s = stylex.create({
  panel: {
    marginTop: 0,
    marginRight: 10,
    marginBottom: 0,
    marginLeft: 10,
    borderTopWidth: 2,
    borderTopStyle: 'solid',
    borderTopColor: 'var(--color-text)',
    backgroundColor: 'var(--color-surface)',
    paddingTop: 12,
    paddingRight: 16,
    paddingBottom: 12,
    paddingLeft: 16,
  },

  label: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-neutral-700)',
    fontWeight: 600,
    marginBottom: 6,
  },

  text: {
    fontFamily: 'var(--font-target), var(--font-body)',
    marginTop: 0,
    marginBottom: 0,
    fontSize: 19,
    fontWeight: 500,
    lineHeight: 1.3,
    color: 'var(--color-text)',
  },

  reading: {
    marginTop: 2,
    marginBottom: 0,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: 'var(--color-neutral-700)',
  },
});
