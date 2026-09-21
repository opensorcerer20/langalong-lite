/* One tile, for both rows: tap a `bank` tile to place it, a `placed` tile to
   send it back.

   The face is --font-target, set by PhoneColumn from the language pack. */

import * as stylex from '@stylexjs/stylex';

import type { Tile as TileData } from '../data/types';

export interface TileProps {
  readonly tile: TileData;
  /** Where the tile is sitting: in the bank, or on the answer line. */
  readonly variant: 'bank' | 'placed';
  /** The reading beneath the text. See SHOW_READING in src/config.ts. */
  readonly showReading?: boolean;
  /**
   * Bank tiles only: this tile is currently on the answer line. It keeps its
   * space in the layout but is hidden, so the bank never reflows mid-sentence.
   */
  readonly used?: boolean;
  /** Locked — the answer is settled, so the tile no longer responds. */
  readonly disabled?: boolean;
  readonly onClick?: () => void;
}

export function Tile({
  tile,
  variant,
  showReading = true,
  used = false,
  disabled = false,
  onClick,
}: TileProps) {
  const [text, reading] = tile;
  const isBank = variant === 'bank';

  return (
    <button
      type="button"
      {...stylex.props(s.tile, isBank ? s.bank : s.placed, used && s.used)}
      /* StyleX class names are hashed, so this is how tests find a tile's row. */
      data-variant={variant}
      data-used={used || undefined}
      /* Hidden tiles must leave the tab order too, or focus lands on nothing. */
      tabIndex={used ? -1 : undefined}
      aria-hidden={used || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <span {...stylex.props(s.text)}>{text}</span>
      {showReading && (
        <span {...stylex.props(s.reading, isBank ? s.readingBank : s.readingPlaced)}>
          {reading}
        </span>
      )}
    </button>
  );
}

const s = stylex.create({
  tile: {
    fontFamily: 'var(--font-target), var(--font-body)',
    paddingTop: 7,
    paddingRight: 11,
    paddingBottom: 6,
    paddingLeft: 11,
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 1,
    lineHeight: 1.15,
  },

  text: {
    fontSize: 19,
    fontWeight: 500,
  },

  reading: {
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.06em',
  },

  /* Placed tiles invert to ink-on-ground.

     - `:hover:not(:disabled)` as a condition key is undocumented StyleX, but
       compiles to that exact selector.
     - The hover value must sit inside each property with its default: StyleX
       merges per property, so a separate hover style would replace the default. */
  placed: {
    backgroundColor: {
      default: 'var(--color-text)',
      ':hover:not(:disabled)': 'var(--color-accent-700)',
    },
    color: 'var(--color-bg)',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: {
      default: 'var(--color-text)',
      ':hover:not(:disabled)': 'var(--color-accent-700)',
    },
  },

  readingPlaced: {
    opacity: 0.85,
  },

  /* Bank tiles are surface with a 2px rule, taking the accent on hover. */
  bank: {
    backgroundColor: 'var(--color-surface)',
    color: {
      default: 'var(--color-text)',
      ':hover:not(:disabled)': 'var(--color-accent-700)',
    },
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: {
      default: 'var(--color-divider)',
      ':hover:not(:disabled)': 'var(--color-accent)',
    },
  },

  readingBank: {
    color: 'var(--color-neutral-700)',
  },

  /* A placed tile's slot in the bank: hidden, but still occupying its space so
     the remaining tiles do not reflow under the learner's finger mid-sentence. */
  used: {
    visibility: 'hidden',
  },
});
