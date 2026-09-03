/* The shapes content is *stored* in — the schema from
   docs/japanese-app-content-architecture.md.

   The distinction that matters: this file describes content at rest, where a
   tile is authored once and an exercise points at it by id. types.ts describes
   content in play, where an exercise has already had its tiles looked up and
   handed to it. resolve.ts is what turns the first into the second.

   Storing it this way is what stops a tile from being re-typed at every site it
   appears — この is one tile shared by two situations, not two tuples that
   happen to match — and it is what lets a tile carry facts about itself (its
   word class, later its tags) that a bare [text, reading] pair had nowhere to
   put.

   Nothing here is Japanese. A library is any L1→L2 pairing. */

/**
 * A tile's word class. Required on every tile — it is half the identity of a
 * tile, not decoration, since two tiles may share their written form and differ
 * only in this.
 *
 * These are the classes the current content needs. A language that needs one
 * more adds it here; the set is deliberately small and closed, so a typo in a
 * content file is a type error rather than a silently novel category.
 */
export type TileType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'particle'
  /** Copula, polite endings and conjugation suffixes: です, ます, たい. */
  | 'ending'
  /** Counting expressions: 二つ, 二枚. */
  | 'counter'
  /** これ / この / それ / あの. */
  | 'demonstrative'
  /** Question words: どこ, 何, いくら. */
  | 'question';

/**
 * A tile's id, and also its dedup key: `type:l2`, e.g. `particle:を`.
 *
 * Deriving the id from the pair that identifies a tile means there is no id to
 * allocate, no counter to keep, and no way for two authored tiles to collide
 * without also being the same tile. It also reads in a content file — an
 * exercise's answer is a list you can follow without a lookup table.
 */
export type TileId = `${TileType}:${string}`;

/** A situation's id, e.g. `bakery`. Unique within a library. */
export type ScenarioId = string;

/**
 * An L1→L2 pairing, e.g. `en2ja` — the language the learner speaks against the
 * one they are learning. A course-level fact, which is why it sits on the
 * scenario rather than on every exercise.
 */
export type LibraryId = string;

/**
 * One tile, authored once for the whole library.
 *
 * A tile used by three situations is one record listing all three in
 * `scenarioIds`, not three records — which is the point of storing content this
 * way at all.
 */
export interface StoredTile {
  /** `type:l2`. See TileId. */
  readonly id: TileId;
  /**
   * Every situation whose content uses this tile — in one of its exercises, or
   * in its vocabulary list. A record of where the tile is in play, nothing
   * more: what a situation offers as distractors is StoredScenario.vocab, so
   * adding a scenario here never changes what the learner sees.
   *
   * Empty means no situation uses it yet, which is ordinary for a grammar-pool
   * tile like と that is a distractor and nothing else.
   */
  readonly scenarioIds: readonly ScenarioId[];
  /** The target-language text as it appears on the tile, e.g. パン. */
  readonly l2: string;
  /** Its reading in latin script — romaji for Japanese, pinyin for Mandarin. */
  readonly reading: string;
  readonly type: TileType;
}

/**
 * One drill item at rest: a prompt, and the tile sequences that answer it.
 *
 * Full sentences and short grammar phrases are the same shape — a phrase is
 * just an exercise with a shorter answer — so nothing downstream ever branches
 * on which one it is holding.
 */
export interface StoredExercise {
  /** `<scenarioId>-<nn>`, e.g. `bakery-01`. */
  readonly id: string;
  readonly scenarioId: ScenarioId;
  /** The L1 prompt shown to the learner, e.g. 'One bread, please.' */
  readonly promptText: string;
  /** The canonical answer, as tile ids in order. */
  readonly answerTileIds: readonly TileId[];
  /**
   * Other tile sequences accepted as correct, each one a complete answer in its
   * own right. Always present, often empty.
   *
   * Stored as tiles rather than as written-out strings so an alternate never
   * has to be split back into tiles to be built — which for a language written
   * without spaces cannot be done reliably at all.
   */
  readonly alternateAnswerTileIds: readonly (readonly TileId[])[];
  /** The grammar explanation shown after a second miss. Always required. */
  readonly note: string;
  /**
   * Flat grammar labels, e.g. 'particle:を'. Not read by anything yet; the
   * field exists so content can start carrying them.
   */
  readonly tags: readonly string[];
}

/** One situation. */
export interface StoredScenario {
  readonly id: ScenarioId;
  /** The situation's name, e.g. 'Bakery'. */
  readonly name: string;
  readonly library: LibraryId;

  /* TODO: the three fields below are not in the content architecture doc yet.
     `kicker` and `blurb` are presentation copy and `vocab` is a distractor-only
     word list — words that appear in no answer but keep the bank varied. They
     are hard-coded alongside the scenario for now. Where they should actually
     live is a decision for the authoring-format work, not this migration. */

  /** Home-screen eyebrow, e.g. 'Set 01'. */
  readonly kicker: string;
  /** Home-screen one-liner describing the situation. */
  readonly blurb: string;
  /**
   * Tiles this situation supplies as distractors on top of the ones its
   * exercises use. Every id here should be a tile listing this scenario.
   */
  readonly vocab: readonly TileId[];
}

/** A whole library's content at rest: the three tables, and nothing derived. */
export interface ContentStore {
  readonly library: LibraryId;
  readonly scenarios: readonly StoredScenario[];
  /** Every tile in the library, including the shared grammar pool. */
  readonly tiles: readonly StoredTile[];
  readonly exercises: readonly StoredExercise[];
  /**
   * The shared distractor pool: the particles, endings and function words every
   * situation draws on, on top of its own vocabulary.
   *
   * A list of its own rather than "the tiles with no scenarioIds", because most
   * grammar tiles are also used by an exercise somewhere — を is in the pool
   * *and* in half the bakery answers — so membership cannot be inferred from
   * whether the tile happens to be in play anywhere.
   */
  readonly grammarTileIds: readonly TileId[];
}
