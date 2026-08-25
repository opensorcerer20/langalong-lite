/* One tile — the only place a piece of Japanese is drawn.

   The same component serves both rows: a `bank` tile is surface with a rule and
   is tapped to place it, a `placed` tile is inverted ink-on-ground and is tapped
   to send it back. */

import type { Tile as TileData } from '../../data/types';
import styles from './Tile.module.css';

export interface TileProps {
  readonly tile: TileData;
  /** Where the tile is sitting: in the bank, or on the answer line. */
  readonly variant: 'bank' | 'placed';
  /** Romaji beneath the kana. See SHOW_ROMAJI in src/config.ts. */
  readonly showRomaji?: boolean;
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
  showRomaji = true,
  used = false,
  disabled = false,
  onClick,
}: TileProps) {
  const [kana, romaji] = tile;

  return (
    <button
      type="button"
      className={`${styles.tile} ${styles[variant]}`}
      data-used={used || undefined}
      /* Hidden tiles must leave the tab order too, or focus lands on nothing. */
      tabIndex={used ? -1 : undefined}
      aria-hidden={used || undefined}
      disabled={disabled}
      onClick={onClick}
    >
      <span className={styles.kana}>{kana}</span>
      {showRomaji && <span className={styles.romaji}>{romaji}</span>}
    </button>
  );
}
