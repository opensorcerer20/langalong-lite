/* Runtime shapes for the content files, for scripts only.

   The app never needs this. It imports content/ja/*.json as literals, so tsc
   checks them against CoreFile and SituationFile before anything runs. A script
   handed a path reads a file tsc has never seen, and that is the one boundary
   in the repo where the types are a claim rather than a fact.

     app     content/ja/*.json ──import──►  tsc checks it
     script  <any path>        ──read────►  parseSituationFile checks it

   The interfaces in src/data/ stay authoritative; these mirror them. Two things
   keep the mirror honest: the assertions below fail to compile if a schema stops
   producing what the interface requires, and the tests parse the real content
   files, which fails if a schema asks for more than the app does.

   Objects are strict, so a typo'd optional key — "nte" for "note" — is an error
   here rather than a field silently dropped. */

import { z } from 'zod';

import type { CoreFile, SituationFile } from '../src/data/assemblePack';

const Lexicon = z.record(z.string(), z.string());

const Item = z
  .object({
    id: z.string(),
    en: z.string(),
    ans: z.string(),
    alts: z.array(z.string()).optional(),
    note: z.string().optional(),
    teaches: z.array(z.string()).optional(),
  })
  .strict();

const Scenario = z
  .object({
    id: z.string(),
    name: z.string(),
    blurb: z.string(),
    words: z.array(z.string()).optional(),
    items: z.array(Item),
  })
  .strict();

export const SituationFileSchema = z
  .object({ lexicon: Lexicon, scenario: Scenario })
  .strict();

export const CoreFileSchema = z
  .object({
    code: z.string(),
    name: z.string(),
    joiner: z.string(),
    fontStack: z.string(),
    lexicon: Lexicon,
    grammar: z.array(z.string()),
    particles: z.record(z.string(), z.object({ tile: z.string(), gloss: z.string() }).strict()),
    conjugations: z.record(z.string(), z.object({ name: z.string(), note: z.string() }).strict()),
  })
  .strict();

/**
 * A zod output type, comparable with the app's interfaces.
 *
 * zod types an optional field as `words?: string[] | undefined`. Under
 * exactOptionalPropertyTypes the app means `words?: readonly string[]` — an
 * absent key, never a present undefined. JSON has no undefined, so parsed data
 * never carries one; the difference is in the types alone. This drops the
 * `| undefined` at every depth so the two can be compared.
 */
type AsAuthored<T> = T extends object ? { [K in keyof T]: AsAuthored<Exclude<T[K], undefined>> } : T;

/* Compile-time: a parsed file must satisfy what the app requires. Drop a field
   from a schema above, or change its type, and these stop compiling. */
const _situation: SituationFile = {} as AsAuthored<z.infer<typeof SituationFileSchema>>;
const _core: CoreFile = {} as AsAuthored<z.infer<typeof CoreFileSchema>>;
void _situation;
void _core;

/**
 * Parse a situation file, or throw listing every problem at once.
 *
 * @param where The path, for the message — nothing else identifies the file.
 */
export function parseSituationFile(value: unknown, where: string): SituationFile {
  return parse(SituationFileSchema, value, where);
}

export function parseCoreFile(value: unknown, where: string): CoreFile {
  return parse(CoreFileSchema, value, where);
}

/**
 * All of a file's problems, one per line, each naming its path in the JSON.
 *
 * Reported together rather than one at a time: fixing a content file one throw
 * per run is the kind of friction this whole effort exists to remove.
 */
function parse<S extends z.ZodType>(schema: S, value: unknown, where: string): AsAuthored<z.infer<S>> {
  const result = schema.safeParse(value);

  /* Sound for the reason AsAuthored gives: parsed JSON never holds undefined. */
  if (result.success) return result.data as AsAuthored<z.infer<S>>;

  const problems = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `  ${path === '' ? '(the file itself)' : path} — ${issue.message}`;
  });

  throw new Error(`${where} does not have the shape of a content file:\n${problems.join('\n')}`);
}
