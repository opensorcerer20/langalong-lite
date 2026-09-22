/* The line the sentence is built on. Tapping a placed tile sends it back, along
   with everything after it, so the next tile tapped lands in that spot.

   No placeholder slots: they would give away the answer's length, and an
   alternate answer may be a different length anyway. */

import * as stylex from '@stylexjs/stylex';

import type { Tile as TileData } from '../data/types';
import { Tile } from './Tile';

export interface AnswerLineProps {
  /** The item's tile bank. `placed` holds positions in it. */
  readonly bank: readonly TileData[];
  /** Bank positions the learner has placed, in order. */
  readonly placed: readonly number[];
  readonly showReading?: boolean;
  /** The answer is settled: tiles stay put and stop responding. */
  readonly locked?: boolean;
  /** Line positions to mark as not belonging. See HIGHLIGHT_AFTER_MISSES. */
  readonly wrongPositions?: readonly number[];
  /** Called with the tile's position on the line, not its bank index. */
  readonly onRemove: (position: number) => void;
}

export function AnswerLine({
  bank,
  placed,
  showReading,
  locked = false,
  wrongPositions = [],
  onRemove,
}: AnswerLineProps) {
  return (
    <div {...stylex.props(s.answer)}>
      <div {...stylex.props(s.tiles)}>
        {placed.map((bankIndex, position) => {
          const tile = bank[bankIndex];
          if (!tile) return null;
          return (
            <Tile
              /* Keyed by position: the same tile can legitimately appear twice
                 on the line, so the bank index is not unique here. */
              key={`${position}-${bankIndex}`}
              tile={tile}
              variant="placed"
              showReading={showReading ?? true}
              disabled={locked}
              wrong={wrongPositions.includes(position)}
              onClick={() => onRemove(position)}
            />
          );
        })}
      </div>
    </div>
  );
}

const s = stylex.create({
  answer: {
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    /* Holds two rows of tiles, so the bank below does not move as the sentence
       grows past the first line. */
    minHeight: 104,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
  },

  tiles: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'flex-start',
  },
});
