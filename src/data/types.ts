/* The shapes a language pack is written in. Types only — no logic and no values
   live here, so anything that imports this file stays free of content.

   Nothing in these shapes is Japanese. The Japanese itself lives in ja/, and a
   second language is a sibling folder of the same shape — see LanguagePack. */

/**
 * One tile: the target-language text as it appears on the tile, and its reading
 * in latin script — romaji for Japanese, pinyin for Mandarin, and so on.
 */
export type Tile = readonly [text: string, reading: string];

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

/**
 * One language the app can drill: its content, plus the two things about it the
 * rest of the app cannot infer — how its script joins, and what renders it.
 */
export interface LanguagePack {
  /** BCP 47 tag. The pack's identity in the registry. */
  readonly code: string;
  /** The language's name in English. UI copy uses it directly. */
  readonly name: string;
  /**
   * What goes between tiles when they are joined into a sentence, and what is
   * skipped when a sentence is segmented back into tiles. Empty for Japanese,
   * which is written without spaces; ' ' for a space-separated language.
   *
   * This is the one genuinely script-dependent rule in the app, which is why it
   * is declared here rather than assumed in lib/.
   */
  readonly joiner: string;
  /**
   * Font families to try ahead of the body stack when drawing target-language
   * text. A face declared in src/styles/fonts.css, or an OS font.
   */
  readonly fontStack: string;
  /**
   * The shared distractor pool: this language's particles, endings and function
   * words. Every situation draws from it on top of its own vocabulary, so a
   * wrong tile is always grammatically plausible.
   */
  readonly grammar: readonly Tile[];
  /**
   * The situations this language drills, in home-screen order.
   *
   * Scenarios belong to the language, not to the app. Another language's set
   * may look nothing like Japanese's — a train station is worth drilling in
   * Japanese and may be pointless elsewhere — so a new pack starts from
   * whatever situations suit it rather than mirroring this one.
   */
  readonly scenarios: readonly Scenario[];
}
