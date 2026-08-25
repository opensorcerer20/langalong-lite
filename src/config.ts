/* The three dials that change how the drill feels. Everything else about the
   difficulty is a property of the content itself. */

/**
 * Distractor density: the bank holds roughly this many times the tiles the
 * answer needs (minimum 12), so a sentence cannot be brute-forced by
 * elimination. Sensible range is 1.5–4.5.
 */
export const TILE_MULTIPLIER = 3;

/** Misses before the grammar note appears. The first miss is a silent retry. */
export const NOTE_AFTER_MISSES = 2;

/** Misses before the "Show me the answer" button appears. */
export const REVEAL_AFTER_MISSES = 3;

/** Romaji beneath the kana on every tile. */
export const SHOW_ROMAJI = true;
