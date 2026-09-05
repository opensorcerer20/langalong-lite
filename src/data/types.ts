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

/**
 * How a verb inflects, which is what decides how a pattern is formed from it.
 *
 * The three names are Japanese grammar's, but the concept is not: most
 * languages sort their verbs into conjugation classes, and a pack that needs
 * different names declares different ones. Nothing outside a pack reads the
 * values — they are only ever matched against each other.
 */
export type VerbGroup = 'godan' | 'ichidan' | 'irregular';

/**
 * One function word the language marks grammatical roles with.
 *
 * The tile itself is already in the grammar pool; this adds what the pool
 * cannot express — which particles are worth contrasting against which, so a
 * drill can offer a genuinely confusable wrong answer rather than a random one.
 */
export interface Particle {
  /**
   * Durable identity. Latin and free of ":", because it is a storage key
   * segment: `ja:particle:wo`. Fixed once shipped, like every other id here.
   *
   * Not the particle's text, which is the one thing that could not serve — a
   * key has to survive being written down in a database and read back, and は
   * is neither latin nor unambiguous once romanised (は is read "wa" here and
   * "ha" elsewhere).
   */
  readonly id: string;
  /** The particle as it appears on a tile. Also in the pack's grammar pool. */
  readonly tile: Tile;
  /** What it does, in one short phrase. Shown as the answer's explanation. */
  readonly gloss: string;
  /**
   * Particle ids commonly confused with this one — the distractor set.
   *
   * Declared rather than derived: which particles compete is a fact about the
   * language and about learners, not something the tile texts imply. Meant to
   * be symmetrical (if は lists が, が lists は); the content tests check it.
   */
  readonly confusedWith: readonly string[];
}

/** One inflected form a verb can be drilled into. */
export interface ConjugationPattern {
  /** Durable identity, and a storage key segment: `ja:conjugation:te-form`. */
  readonly id: string;
  /** The name a learner would recognise: "te-form", "past plain". */
  readonly name: string;
  /** Which verb groups this pattern applies to. */
  readonly verbGroups: readonly VerbGroup[];
  /** How the form is built, shown when the learner gets it wrong. */
  readonly note: string;
}

/**
 * What a sentence teaches, as opposed to what it happens to contain.
 *
 * Authored rather than inferred, and the distinction is the point. Every
 * sentence in the bakery set contains です; almost none of them are *about*
 * です. Tagging is what lets a later exercise ask "drill the thing this
 * sentence was written to teach" and lets remediation say which grammar point
 * a learner keeps missing, neither of which follows from the answer tiles.
 *
 * Vocabulary is deliberately absent: which words a sentence uses genuinely
 * does follow from its tiles, so it is derived — see src/lib/tags.ts.
 */
export interface SentenceTags {
  /** Particle ids this sentence exercises. May be empty. */
  readonly particles: readonly string[];
  /** Conjugation pattern ids this sentence exercises. May be empty. */
  readonly conjugations: readonly string[];
}

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
  /** The grammar points this sentence was written to teach. See SentenceTags. */
  readonly tags: SentenceTags;
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
   * The pack's particles, as declared things rather than as loose tiles.
   *
   * Every one of these also appears in `grammar` — the pool is what feeds
   * distractors into the sentence drill, and that must not change — so the two
   * overlap on purpose. What this adds is identity and confusability, neither
   * of which a bare tile can carry. The content tests hold the two in step.
   */
  readonly particles: readonly Particle[];
  /** The inflected forms this language's verbs can be drilled into. */
  readonly conjugations: readonly ConjugationPattern[];
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
