/* The shapes content is *authored* in — the raw format from
   docs/japanese-app-content-architecture.md.

     rawContent.ts  authored  ─buildStore─►  schema.ts  stored  ─resolve─►  drill.ts  in play
     JSON, tuples, no ids                    tables, ids, deduped           tiles looked up

   Tuples, not ids: a tile's id is its type and text joined, so
   ["パン", "pan", "noun"] already says what `noun:パン` says. Same three fields
   in answers, alternates, grammar and vocab alike.

   Schemas first, types derived from them — there is one definition, so the two
   cannot drift. validateRaw.ts runs these; nothing else should.

   zod is a devDependency: nothing in the app imports this folder. */

import { z } from 'zod';
import type { TileType } from '../schema';

/* A key per TileType: adding one to schema.ts without adding it here is a type error. */
export const TILE_TYPES: Record<TileType, true> = {
  noun: true,
  verb: true,
  adjective: true,
  particle: true,
  ending: true,
  counter: true,
  demonstrative: true,
  question: true,
};

const TYPE_NAMES = Object.keys(TILE_TYPES);

/** One authored tile. `type` is half a tile's identity, so it is required, never defaulted. */
export type RawTuple = readonly [newLanguageText: string, reading: string, type: TileType];

/* Hand-checked rather than z.tuple: the useful messages name the tile
   ("パン has no reading"), which needs one element while validating another. */
const Tuple = z
  .unknown()
  .superRefine((value, ctx) => {
    const reject = (message: string) => ctx.addIssue({ code: 'custom', message });

    if (!Array.isArray(value)) return reject('expected a [text, reading, type] tuple');
    if (value.length !== 3) {
      return reject(`expected a [text, reading, type] tuple, got ${value.length} element(s)`);
    }

    const [text, reading, type] = value as unknown[];
    if (typeof text !== 'string' || text.trim() === '') {
      return reject('tile text must be a non-empty string');
    }
    if (typeof reading !== 'string' || reading.trim() === '') {
      return reject(`tile "${text}" has no reading`);
    }
    if (typeof type !== 'string' || !Object.hasOwn(TILE_TYPES, type)) {
      return reject(
        `tile "${text}" has type ${JSON.stringify(type)}; expected one of: ${TYPE_NAMES.join(', ')}`,
      );
    }
  })
  .transform((value) => value as RawTuple);

/** A required string field, naming itself in both failure messages. */
const required = (field: string) =>
  z
    .string({ error: `"${field}" must be a string` })
    .refine((value) => value.trim() !== '', { error: `"${field}" must not be empty` });

/** An array of tuples for `field`, rejecting a non-array by name. */
const tupleList = (field: string) => z.array(Tuple, { error: `"${field}" must be an array` });

/* zod infers mutable arrays; the authored shapes were readonly before it, and
   .readonly() keeps them that way (and freezes the parsed value). */

/**
 * An object that rejects fields it has no room for — `alt` for `alts` would
 * otherwise drop an alternate silently.
 */
function strict<T extends z.ZodRawShape>(shape: T) {
  const allowed = Object.keys(shape).join(', ');
  return z.strictObject(shape, {
    error: (issue) => {
      if (issue.code === 'unrecognized_keys') {
        return `unknown field "${issue.keys[0]}" (expected one of: ${allowed})`;
      }
      if (issue.code === 'invalid_type') return 'expected an object';
      return undefined;
    },
  });
}

/** Grammar labels, grouped as an author writes them. tags.ts flattens these to `particle:を`. */
const Tags = strict({
  particles: z.array(required('particles')).readonly().optional(),
  conjugations: z.array(required('conjugations')).readonly().optional(),
});

/** One authored exercise. A short phrase is just a shorter `answer` — no separate shape. */
const Entry = strict({
  /** Authoritative. The file an entry sits in is a convenience, not the source of truth. */
  scenario: required('scenario'),
  question: required('question'),
  answer: tupleList('answer').min(1, { error: '"answer" must have at least one tile' }).readonly(),
  /** Optional: 15 of the 18 current entries have no alternates. */
  alts: z
    .array(tupleList('alts').min(1, { error: 'must have at least one tile' }).readonly())
    .readonly()
    .optional(),
  note: required('note'),
  tags: Tags.optional(),
});

/** One situation's facts. None of these can be recovered from its entries. */
const ScenarioMeta = strict({
  id: required('id'),
  name: required('name'),
  blurb: required('blurb'),
  /** This situation's entries file, relative to the library folder. */
  file: required('file'),
  /**
   * Words offered as wrong options, on top of the grammar pool. Overlaps the
   * answers by hand: holds words in no answer, omits words that are.
   *
   * Order is load-bearing — buildBank steps through [grammar, ...vocab] at a
   * fixed stride. Preserved verbatim on import, never sorted. Empty is legal.
   */
  vocab: tupleList('vocab').readonly(),
});

/** A library's manifest: everything about the library that is not an exercise. */
const Manifest = strict({
  library: required('library'),
  /** Shared distractors. Explicit, because を is in the pool *and* in half the bakery answers. */
  grammar: tupleList('grammar').min(1, { error: '"grammar" must not be empty' }).readonly(),
  /** Home-screen order. `kicker` is derived from position here, so it cannot drift. */
  scenarios: z
    .array(ScenarioMeta, { error: '"scenarios" must be an array' })
    .min(1, { error: '"scenarios" must not be empty' })
    .readonly(),
});

export const EntriesSchema = z.array(Entry, { error: 'expected an array of entries' }).readonly();
export const ManifestSchema = Manifest;

export type RawTags = z.infer<typeof Tags>;
export type RawEntry = z.infer<typeof Entry>;
export type RawScenarioMeta = z.infer<typeof ScenarioMeta>;
export type RawManifest = z.infer<typeof Manifest>;

/* No `language` field: joiner and font stack describe Japanese, not this
   content, and stay hand-authored beside the resolveLibrary call in index.ts. */
