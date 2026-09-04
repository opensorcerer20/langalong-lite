/* The bank the sentence is built from.

   Deliberately oversupplied — see buildBank — so the answer cannot be found by
   elimination. Tiles already on the answer line are hidden in place rather than
   removed, which keeps the rest of the bank from reflowing mid-sentence. */

import * as stylex from '@stylexjs/stylex';

import type { Tile as TileData } from '../data/drill';
import { Tile } from './Tile';

export interface TileBankProps {
  readonly bank: readonly TileData[];
  /** Bank positions currently on the answer line. */
  readonly placed: readonly number[];
  readonly showReading?: boolean;
  /** The answer is settled: the bank stops responding. */
  readonly locked?: boolean;
  readonly onPlace: (bankIndex: number) => void;
}

export function TileBank({ bank, placed, showReading, locked = false, onPlace }: TileBankProps) {
  const used = new Set(placed);

  return (
    <div {...stylex.props(s.bank)}>
      {bank.map((tile, bankIndex) => (
        <Tile
          /* Keyed by bank position, which is stable for the life of the item —
             so placing a tile never remounts the others and keyboard focus
             survives the tap. */
          key={bankIndex}
          tile={tile}
          variant="bank"
          showReading={showReading ?? true}
          used={used.has(bankIndex)}
          disabled={locked}
          onClick={() => onPlace(bankIndex)}
        />
      ))}
    </div>
  );
}

const s = stylex.create({
  bank: {
    paddingTop: 18,
    paddingRight: 20,
    paddingBottom: 18,
    paddingLeft: 20,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignContent: 'flex-start',
    /* Takes the slack in the column, so the actions sit at the bottom. */
    flex: 1,
  },
});
