/* Turns authored content into store rows.

     content/en2ja/*.json  ──►  src/data/en2ja/_generated/{tiles,exercises}.ts

   The authored shape is the one in docs/japanese-app-content-architecture.md: a
   file is a flat array of entries, and an entry writes its answer out as
   [text, reading, type] tuples rather than as a sentence string. That is the
   whole reason this script is short — Japanese has no spaces, so tiles can only
   ever be authored explicitly, and a tuple already carries everything a
   StoredTile needs. There is nothing to segment and nothing to infer.

   The script reads the *whole* content directory every run and rewrites both
   output files. Doing it wholesale rather than per-file is what makes dedup
   trivial: one pass knows every tile in the library, so two scenarios that both
   use を produce one row, and resolveLibrary's duplicate-id throw can never fire
   on generated output.

   What it deliberately does not generate: scenarios.ts (name/kicker/blurb/vocab)
   and the grammar pool in tiles.ts. Neither has anywhere to live in the authored
   shape. Adding a scenario is therefore two actions — a JSON file here, and a
   StoredScenario entry by hand. */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { z } from 'zod';

import { EN2JA_TILES } from '../src/data/en2ja/tiles';
import type { StoredExercise, StoredTile, TileId, TileType } from '../src/data/schema';

const CONTENT_DIR = new URL('../content/en2ja/', import.meta.url);
const OUT_DIR = new URL('../src/data/en2ja/_generated/', import.meta.url);

/* Mirrored from TileType in src/data/schema.ts. `satisfies` is what keeps the
   two in step: adding a type there without adding it here is a type error at
   the point the mirror is declared, not a silently rejected content file. */
const TILE_TYPES = [
  'noun',
  'verb',
  'adjective',
  'particle',
  'ending',
  'counter',
  'demonstrative',
  'question',
] as const satisfies readonly TileType[];

/** One authored tile: its text, its reading, its word class. */
const tupleSchema = z.tuple([z.string().min(1), z.string().min(1), z.enum(TILE_TYPES)]);

const entrySchema = z.object({
  scenario: z.string().min(1),
  question: z.string().min(1),
  /* Two tiles is the floor the content tests already enforce; rejecting a
     one-tile answer here means the failure names the JSON rather than surfacing
     later as a test failure on generated output. */
  answer: z.array(tupleSchema).min(2),
  alts: z.array(z.array(tupleSchema)).default([]),
  note: z.string().min(1),
  /* { particles: ['を'], conjugations: ['たい'] } — flattened on the way out. */
  tags: z.record(z.string(), z.array(z.string())).default({}),
});

type Entry = z.infer<typeof entrySchema>;
type Tuple = z.infer<typeof tupleSchema>;

/** A tile's id is its identity: word class and text, colon-joined. */
const tileIdOf = ([text, , type]: Tuple): TileId => `${type}:${text}`;

/** `{ particles: ['を'] }` → `['particle:を']`. The key is a plural of the class. */
const flattenTags = (tags: Entry['tags']): string[] =>
  Object.entries(tags).flatMap(([key, values]) =>
    values.map((value) => `${key.replace(/s$/, '')}:${value}`),
  );

/* scenarioIds accumulates as entries are walked, so the row is built in place
   and only frozen into a StoredTile on the way out. */
type DraftTile = Omit<StoredTile, 'scenarioIds'> & { scenarioIds: string[] };

/**
 * The whole transform. Pure: entries in, rows out.
 *
 * `known` is the set of tile ids already hand-authored in tiles.ts. A tuple
 * naming one of those resolves to the existing row and is not re-emitted —
 * which is what stops the generated registry from colliding with the written
 * one. It is not an error for content to use a word that already exists; that
 * is the normal case for every particle.
 */
function toStore(
  entries: readonly Entry[],
  known: ReadonlySet<string>,
): { tiles: StoredTile[]; exercises: StoredExercise[] } {
  const tiles = new Map<TileId, DraftTile>();
  const exercises: StoredExercise[] = [];
  /* Per scenario, so exercise numbering restarts at 01 in each set even though
     one run may cover several files. */
  const seen = new Map<string, number>();

  for (const entry of entries) {
    const n = (seen.get(entry.scenario) ?? 0) + 1;
    seen.set(entry.scenario, n);

    for (const tuple of [entry.answer, ...entry.alts].flat()) {
      const id = tileIdOf(tuple);
      if (known.has(id)) continue;

      const existing = tiles.get(id);
      if (existing) {
        if (!existing.scenarioIds.includes(entry.scenario)) {
          existing.scenarioIds.push(entry.scenario);
        }
      } else {
        tiles.set(id, {
          id,
          scenarioIds: [entry.scenario],
          newLanguageText: tuple[0],
          reading: tuple[1],
          type: tuple[2],
        });
      }
    }

    exercises.push({
      id: `${entry.scenario}-${String(n).padStart(2, '0')}`,
      scenarioId: entry.scenario,
      promptText: entry.question,
      answerTileIds: entry.answer.map(tileIdOf),
      alternateAnswerTileIds: entry.alts.map((alt) => alt.map(tileIdOf)),
      note: entry.note,
      tags: flattenTags(entry.tags),
    });
  }

  return { tiles: [...tiles.values()], exercises };
}

const HEADER = `/* Generated by \`npm run import\`. Do not edit.
   Edit the files in content/en2ja/ and re-run the script. */`;

function emitModule(fileName: string, typeName: string, exportName: string, rows: unknown): void {
  const source = `${HEADER}

import type { ${typeName} } from '../../schema';

export const ${exportName}: readonly ${typeName}[] = ${JSON.stringify(rows, null, 2)};
`;
  writeFileSync(new URL(fileName, OUT_DIR), source);
}

/* Sorted, so the same content always produces the same file — the order of
   entries is the order the drill plays them in, and readdir order is not
   guaranteed stable across machines. */
const fileNames = readdirSync(CONTENT_DIR)
  .filter((name) => name.endsWith('.json'))
  .sort();

const entries = fileNames.flatMap((name) =>
  z.array(entrySchema).min(1).parse(JSON.parse(readFileSync(new URL(name, CONTENT_DIR), 'utf8'))),
);

const { tiles, exercises } = toStore(entries, new Set(EN2JA_TILES.map((tile) => tile.id)));

mkdirSync(OUT_DIR, { recursive: true });
emitModule('tiles.ts', 'StoredTile', 'GENERATED_TILES', tiles);
emitModule('exercises.ts', 'StoredExercise', 'GENERATED_EXERCISES', exercises);

console.log(
  `imported ${fileNames.length} file(s): ${exercises.length} exercises, ` +
    `${tiles.length} new tiles (${EN2JA_TILES.length} already registered)`,
);
