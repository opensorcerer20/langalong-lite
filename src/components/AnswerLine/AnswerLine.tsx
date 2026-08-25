/* The line the sentence is built on.

   Placed tiles first, then a short rule for each tile still missing, so the
   learner can see how much of the sentence is left. Tapping a placed tile sends
   it back to the bank. */

import type { Tile as TileData } from '../../data/types';
import { Tile } from '../Tile/Tile';
import styles from './AnswerLine.module.css';

export interface AnswerLineProps {
  /** The item's tile bank. `placed` holds positions in it. */
  readonly bank: readonly TileData[];
  /** Bank positions the learner has placed, in order. */
  readonly placed: readonly number[];
  /** Tiles the answer needs, which is how many slots the line shows. */
  readonly length: number;
  readonly showRomaji?: boolean;
  /** The answer is settled: tiles stay put and stop responding. */
  readonly locked?: boolean;
  /** Called with the tile's position on the line, not its bank index. */
  readonly onRemove: (position: number) => void;
}

export function AnswerLine({
  bank,
  placed,
  length,
  showRomaji,
  locked = false,
  onRemove,
}: AnswerLineProps) {
  const remaining = Math.max(0, length - placed.length);

  return (
    <div className={styles.answer}>
      <div className={styles.tiles}>
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
              showRomaji={showRomaji ?? true}
              disabled={locked}
              onClick={() => onRemove(position)}
            />
          );
        })}

        {Array.from({ length: remaining }, (_, index) => (
          <span key={`slot-${index}`} className={styles.slot} />
        ))}
      </div>
    </div>
  );
}
