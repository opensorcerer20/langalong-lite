/* The only way in from `unknown`: parsed JSON ──► the types in rawContent.ts.

   Structure only. "Is this a well-formed entry?" is answered here; "does this
   tagged particle appear in its answer?" is tags.ts, and "does this tile id
   exist?" is resolve.ts.

   Every failure names the file and the entry, because content is edited by
   hand and a message that does not say where is a message that costs a search.
   Unknown fields are rejected too — `alt` for `alts` would otherwise drop an
   alternate silently. */

import type { TileType } from '../schema';
import type { RawEntry, RawManifest, RawScenarioMeta, RawTags, RawTuple } from './rawContent';

/* A key per TileType: adding one to schema.ts without adding it here is a type error. */
const TILE_TYPES: Record<TileType, true> = {
  noun: true,
  verb: true,
  adjective: true,
  particle: true,
  ending: true,
  counter: true,
  demonstrative: true,
  question: true,
};

const ENTRY_FIELDS = ['scenario', 'question', 'answer', 'alts', 'note', 'tags'];
const SCENARIO_FIELDS = ['id', 'name', 'blurb', 'file', 'vocab'];
const MANIFEST_FIELDS = ['library', 'grammar', 'scenarios'];
const TAG_FIELDS = ['particles', 'conjugations'];

/** Throw with the location prefixed, so no message can be raised without saying where. */
function fail(where: string, problem: string): never {
  throw new Error(`${where}: ${problem}`);
}

/** Narrow to a plain object — null and arrays are not one. */
function object(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(where, 'expected an object');
  }
  return value as Record<string, unknown>;
}

/** Reject a field the shape has no room for, which is nearly always a typo. */
function onlyFields(record: Record<string, unknown>, allowed: readonly string[], where: string): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      fail(where, `unknown field "${key}" (expected one of: ${allowed.join(', ')})`);
    }
  }
}

/** Read a required string field, rejecting whitespace-only as empty. */
function text(record: Record<string, unknown>, field: string, where: string): string {
  const value = record[field];
  if (typeof value !== 'string') fail(where, `"${field}" must be a string`);
  if (value.trim() === '') fail(where, `"${field}" must not be empty`);
  return value;
}

/** Narrow a field to an array; its elements stay unchecked. */
function list(value: unknown, field: string, where: string): unknown[] {
  if (!Array.isArray(value)) fail(where, `"${field}" must be an array`);
  return value;
}

/** One [text, reading, type] tuple. `type` is required — never defaulted. */
function tuple(value: unknown, where: string): RawTuple {
  if (!Array.isArray(value)) fail(where, 'expected a [text, reading, type] tuple');
  if (value.length !== 3) {
    fail(where, `expected a [text, reading, type] tuple, got ${value.length} element(s)`);
  }

  const [newLanguageText, reading, type] = value as unknown[];
  if (typeof newLanguageText !== 'string' || newLanguageText.trim() === '') {
    fail(where, 'tile text must be a non-empty string');
  }
  if (typeof reading !== 'string' || reading.trim() === '') {
    fail(where, `tile "${newLanguageText}" has no reading`);
  }
  if (typeof type !== 'string' || !Object.hasOwn(TILE_TYPES, type)) {
    fail(
      where,
      `tile "${newLanguageText}" has type ${JSON.stringify(type)}; expected one of: ${Object.keys(TILE_TYPES).join(', ')}`,
    );
  }

  return [newLanguageText, reading, type as TileType];
}

/** An array of tuples, each failure naming its index. */
function tuples(value: unknown, field: string, where: string): RawTuple[] {
  return list(value, field, where).map((item, index) => tuple(item, `${where} ${field}[${index}]`));
}

/** Tag groups, left grouped as authored; tags.ts is what flattens them. */
function tags(value: unknown, where: string): RawTags {
  const record = object(value, `${where} tags`);
  onlyFields(record, TAG_FIELDS, `${where} tags`);

  const group = (field: string): readonly string[] | undefined => {
    if (record[field] === undefined) return undefined;
    return list(record[field], field, `${where} tags`).map((item, index) => {
      if (typeof item !== 'string' || item.trim() === '') {
        fail(`${where} tags`, `${field}[${index}] must be a non-empty string`);
      }
      return item;
    });
  };

  /* Built conditionally: exactOptionalPropertyTypes forbids an explicit undefined. */
  const particles = group('particles');
  const conjugations = group('conjugations');
  return {
    ...(particles === undefined ? {} : { particles }),
    ...(conjugations === undefined ? {} : { conjugations }),
  };
}

/**
 * Validate one entries file.
 *
 * @param fileName Used in error messages only; `scenario` inside the entry is
 *                 what actually decides which situation an entry belongs to.
 */
export function parseEntries(value: unknown, fileName: string): RawEntry[] {
  if (!Array.isArray(value)) fail(fileName, 'expected an array of entries');

  return value.map((item, index) => {
    /* 1-based, to match how the file reads and how exercise ids are numbered. */
    const where = `${fileName} entry ${index + 1}`;
    const record = object(item, where);
    onlyFields(record, ENTRY_FIELDS, where);

    const answer = tuples(record['answer'], 'answer', where);
    if (answer.length === 0) fail(where, '"answer" must have at least one tile');

    const alts =
      record['alts'] === undefined
        ? undefined
        : list(record['alts'], 'alts', where).map((alt, altIndex) => {
            const resolved = tuples(alt, `alts[${altIndex}]`, where);
            if (resolved.length === 0) fail(where, `alts[${altIndex}] must have at least one tile`);
            return resolved;
          });

    return {
      scenario: text(record, 'scenario', where),
      question: text(record, 'question', where),
      answer,
      ...(alts === undefined ? {} : { alts }),
      note: text(record, 'note', where),
      ...(record['tags'] === undefined ? {} : { tags: tags(record['tags'], where) }),
    };
  });
}

/** One situation's manifest entry — its copy, its entries file, its distractors. */
function scenario(value: unknown, index: number, fileName: string): RawScenarioMeta {
  const where = `${fileName} scenarios[${index}]`;
  const record = object(value, where);
  onlyFields(record, SCENARIO_FIELDS, where);

  return {
    id: text(record, 'id', where),
    name: text(record, 'name', where),
    blurb: text(record, 'blurb', where),
    file: text(record, 'file', where),
    /* Empty is legal: a situation may offer no distractors of its own. */
    vocab: tuples(record['vocab'], 'vocab', where),
  };
}

/** Validate a library manifest. */
export function parseManifest(value: unknown, fileName: string): RawManifest {
  const record = object(value, fileName);
  onlyFields(record, MANIFEST_FIELDS, fileName);

  const grammar = tuples(record['grammar'], 'grammar', fileName);
  if (grammar.length === 0) fail(fileName, '"grammar" must not be empty');

  const scenarios = list(record['scenarios'], 'scenarios', fileName).map((item, index) =>
    scenario(item, index, fileName),
  );
  if (scenarios.length === 0) fail(fileName, '"scenarios" must not be empty');

  const seen = new Set<string>();
  for (const entry of scenarios) {
    if (seen.has(entry.id)) fail(fileName, `two scenarios share the id "${entry.id}"`);
    seen.add(entry.id);
  }

  return { library: text(record, 'library', fileName), grammar, scenarios };
}
