/* Runtime shapes for content files a script reads by path, which tsc never sees.

   - Mirrors the interfaces in src/data/, which stay authoritative. The
     assertions below stop compiling if the two drift.
   - Strict objects, so a typo'd optional key ("nte") is an error. */

import { z } from 'zod';

import type { CoreFile, ScenarioFile } from '../src/data/assemblePack';

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

export const ScenarioFileSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    blurb: z.string(),
    lexicon: Lexicon,
    words: z.array(z.string()).optional(),
    items: z.array(Item),
  })
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
 * Strips zod's `| undefined` from optional fields at every depth, so its types
 * compare with the app's under exactOptionalPropertyTypes. Parsed JSON never
 * holds undefined, so this is sound.
 */
type AsAuthored<T> = T extends object
  ? { [K in keyof T]: AsAuthored<Exclude<T[K], undefined>> }
  : T;

/* Compile-time drift check against the app's types. */
const _scenario: ScenarioFile = {} as AsAuthored<z.infer<typeof ScenarioFileSchema>>;
const _core: CoreFile = {} as AsAuthored<z.infer<typeof CoreFileSchema>>;
void _scenario;
void _core;

/**
 * Parse a situation file, or throw listing every problem at once.
 *
 * @param where The path, for the message — nothing else identifies the file.
 */
export function parseScenarioFile(value: unknown, where: string): ScenarioFile {
  return parse(ScenarioFileSchema, value, where);
}

export function parseCoreFile(value: unknown, where: string): CoreFile {
  return parse(CoreFileSchema, value, where);
}

/** All of a file's problems at once, one per line, each with its JSON path. */
function parse<S extends z.ZodType>(
  schema: S,
  value: unknown,
  where: string,
): AsAuthored<z.infer<S>> {
  const result = schema.safeParse(value);

  if (result.success) return result.data as AsAuthored<z.infer<S>>;

  const problems = result.error.issues.map((issue) => {
    const path = issue.path.join('.');
    return `  ${path === '' ? '(the file itself)' : path} — ${issue.message}`;
  });

  throw new Error(`${where} does not have the shape of a content file:\n${problems.join('\n')}`);
}
