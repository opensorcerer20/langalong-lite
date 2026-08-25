/* The bank the sentence is built from.

   Deliberately oversupplied — see buildBank — so the answer cannot be found by
   elimination. Tiles already on the answer line are hidden in place rather than
   removed, which keeps the rest of the bank from reflowing mid-sentence. */

import type { Tile as TileData } from '../../data/types';
import { Tile } from '../Tile/Tile';
import styles from './TileBank.module.css';

export interface TileBankProps {
  readonly bank: readonly TileData[];
  /** Bank positions currently on the answer line. */
  readonly placed: readonly number[];
  readonly showRomaji?: boolean;
  /** The answer is settled: the bank stops responding. */
  readonly locked?: boolean;
  readonly onPlace: (bankIndex: number) => void;
}

export function TileBank({ bank, placed, showRomaji, locked = false, onPlace }: TileBankProps) {
  const used = new Set(placed);

  return (
    <div className={styles.bank}>
      {bank.map((tile, bankIndex) => (
        <Tile
          /* Keyed by bank position, which is stable for the life of the item —
             so placing a tile never remounts the others and keyboard focus
             survives the tap. */
          key={bankIndex}
          tile={tile}
          variant="bank"
          showRomaji={showRomaji ?? true}
          used={used.has(bankIndex)}
          disabled={locked}
          onClick={() => onPlace(bankIndex)}
        />
      ))}
    </div>
  );
}
