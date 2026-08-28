/* The dials that change how the exercises feel. Everything else about the
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

/**
 * The reading beneath the text on every tile — romaji for Japanese, pinyin for
 * Mandarin, whatever latin-script reading the language pack supplies.
 */
export const SHOW_READING = true;

/**
 * Questions in one vocabulary set. A situation with fewer usable sentences
 * gives a shorter set rather than a padded one.
 */
export const VOCAB_SET_SIZE = 6;

/**
 * Tiles offered per vocabulary question, the right one included. Four makes a
 * blind guess worth 25%, which is low enough that guessing is not a strategy
 * and high enough that the options stay readable at a glance.
 */
export const VOCAB_CHOICES = 4;
