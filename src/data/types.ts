/* The shapes a language pack takes at runtime. Types only.

   Nothing here is Japanese: that lives in content/ja/, and a second language
   would be a sibling folder. */

/**
 * One tile: the text on the tile, and its latin-script reading (romaji for
 * Japanese).
 *
 * The text is the tile's identity: buildBank dedups on it, checkAnswer joins
 * it, revealPlacement matches on it. So within a pack a text has exactly one
 * reading — tests/data/languages.test.ts enforces it.
 */
export type Tile = readonly [text: string, reading: string];

/**
 * A particle, declared so `teaches` can name it. Not shown in the app yet.
 */
export interface Particle {
  /** Latin, e.g. `wa` — the text は is ambiguous once romanised. */
  readonly id: string;
  /** Also in the pack's grammar pool. */
  readonly tile: Tile;
  readonly gloss: string;
}

/**
 * A verb form, declared so `teaches` can name it. Not shown in the app yet.
 */
export interface ConjugationPattern {
  readonly id: string;
  /** The name a learner would recognise: "te-form", "past plain". */
  readonly name: string;
  readonly note: string;
}

/**
 * What a sentence teaches, as opposed to what it contains: every bakery
 * sentence contains です, almost none are about it. Authored for future use;
 * nothing reads it yet.
 */
export interface SentenceTags {
  /** Particle ids this sentence exercises. May be empty. */
  readonly particles: readonly string[];
  /** Conjugation pattern ids this sentence exercises. May be empty. */
  readonly conjugations: readonly string[];
}

/** One drill sentence. */
export interface SentenceItem {
  /** Unique within its scenario. Used to name the sentence in load errors. */
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
  /**
   * The grammar explanation shown after a second miss. Optional: absent, no
   * note appears and the status line stops promising one.
   */
  readonly note?: string;
  /** The grammar points this sentence was written to teach. See SentenceTags. */
  readonly tags: SentenceTags;
}

/** One situation: its sentences plus the vocabulary its distractors draw on. */
export interface Scenario {
  /** Unique within the pack. The home screen's React key. */
  readonly id: string;
  readonly name: string;
  /** Position in the pack, as `01`. Components decide how to say it. */
  readonly lessonNum: string;
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
  /** What goes between joined tiles: '' for Japanese, ' ' for spaced languages. */
  readonly joiner: string;
  /** Font families tried ahead of the body stack. See src/styles/fonts.css. */
  readonly fontStack: string;
  /**
   * The shared distractor pool: particles, endings, function words. Every
   * situation draws from it, so a wrong tile is always grammatically plausible.
   */
  readonly grammar: readonly Tile[];
  /** Overlaps `grammar` on purpose; the content tests keep the two in step. */
  readonly particles: readonly Particle[];
  readonly conjugations: readonly ConjugationPattern[];
  /** In home-screen order. */
  readonly scenarios: readonly Scenario[];
}
