/* The shapes the Japanese content is written in. Types only — no logic and no
   values live here, so anything that imports this file stays free of content. */

/** One tile: the Japanese as it appears on the tile, and its romaji. */
export type Tile = readonly [kana: string, romaji: string];

/** One drill sentence. */
export interface SentenceItem {
  /** The English prompt shown to the learner. */
  readonly en: string;
  /** The canonical answer, split into the tiles that build it. */
  readonly ans: readonly Tile[];
  /**
   * Other answers accepted as correct, written as plain joined strings. The
   * bank generator segments each one and seeds any tile `ans` does not already
   * supply, so every accepted answer is always buildable.
   */
  readonly alts?: readonly string[];
  /** The grammar explanation shown after a second miss. Always required. */
  readonly note: string;
}

/** One situation: its sentences plus the vocabulary its distractors draw on. */
export interface Scenario {
  readonly name: string;
  readonly kicker: string;
  readonly blurb: string;
  readonly items: readonly SentenceItem[];
  /** Scene vocabulary, mixed with the shared grammar pool to make distractors. */
  readonly words: readonly Tile[];
}
