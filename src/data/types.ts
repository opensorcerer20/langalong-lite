/* The shapes a language pack is written in. Types only — no logic and no values
   live here, so anything that imports this file stays free of content.

   Nothing in these shapes is Japanese. The Japanese itself lives in ja/, and a
   second language is a sibling folder of the same shape — see LanguagePack. */

/**
 * One tile: the target-language text as it appears on the tile, and its reading
 * in latin script — romaji for Japanese, pinyin for Mandarin, and so on.
 *
 * The text is the tile's identity, and has been all along: buildBank dedups on
 * it, checkAnswer joins it, revealPlacement matches on it. Storage keys on it
 * too, which makes one invariant load-bearing — within a pack, a given text
 * carries exactly one reading, across the grammar pool, every scenario's words
 * and every answer. Two spellings of the same text would collapse into a single
 * history row. tests/data/languages.test.ts enforces it.
 */
export type Tile = readonly [text: string, reading: string];

/** One drill sentence. */
export interface SentenceItem {
  /**
   * Durable identity, unique within its scenario. Kept short because the full
   * storage key is composed from the pack code and the scenario id rather than
   * written out here — see src/lib/keys.ts.
   *
   * Once shipped this must never change: progress history is stored against it,
   * and editing one orphans everything recorded about that sentence. Rewording
   * `en`, fixing `ans` or adding an `alt` are all safe; changing `id` is not.
   */
  readonly id: string;
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
  /**
   * Durable identity, unique within the pack. The same rule as SentenceItem.id
   * applies: history keys on it, so it is fixed once shipped. Reordering the
   * scenario list is then free, which it is not while position is identity.
   */
  readonly id: string;
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
