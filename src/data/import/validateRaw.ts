/* The only way in from `unknown`: parsed JSON ──► the types in rawContent.ts.

   The schemas live in rawContent.ts; what lives here is everything zod does not
   do for us — turning an issue back into a message that says where, and the two
   checks that span more than one item.

   Structure only. "Is this a well-formed entry?" is answered here; "does this
   tagged particle appear in its answer?" is tags.ts, and "does this tile id
   exist?" is resolve.ts. */

import type { z } from 'zod';

import { EntriesSchema, ManifestSchema } from './rawContent';
import type { RawEntry, RawManifest } from './rawContent';

/**
 * Render an issue's path as the place a person would look.
 *
 * Only array positions survive: `scenarios[1]`, `answer[0]`. A plain field name
 * is dropped because the message already quotes it — `scenarios[1]: "blurb"
 * must not be empty` rather than `scenarios[1] blurb: "blurb" …`.
 */
function place(path: readonly PropertyKey[]): string {
  const parts: string[] = [];

  path.forEach((segment, index) => {
    if (typeof segment === 'number') return;
    const next = path[index + 1];
    if (typeof next === 'number') parts.push(`${String(segment)}[${next}]`);
  });

  return parts.length === 0 ? '' : ` ${parts.join(' ')}`;
}

/** Throw the first issue, prefixed with the file and — for entries — the entry number. */
function report(error: z.ZodError, fileName: string, entryNumbered: boolean): never {
  const issue = error.issues[0];
  if (!issue) throw new Error(`${fileName}: invalid content`);

  const path = issue.path;
  /* Entry files are an array at the top, so path[0] is which entry. 1-based, to
     match how the file reads and how exercise ids are numbered. */
  const entry = entryNumbered && typeof path[0] === 'number' ? ` entry ${path[0] + 1}` : '';
  const rest = entryNumbered ? path.slice(1) : path;

  throw new Error(`${fileName}${entry}${place(rest)}: ${issue.message}`);
}

/**
 * Validate one entries file.
 *
 * @param fileName Used in error messages only; `scenario` inside the entry is
 *                 what actually decides which situation an entry belongs to.
 */
export function parseEntries(value: unknown, fileName: string): readonly RawEntry[] {
  const result = EntriesSchema.safeParse(value);
  if (!result.success) report(result.error, fileName, true);
  return result.data;
}

/** Validate a library manifest. */
export function parseManifest(value: unknown, fileName: string): RawManifest {
  const result = ManifestSchema.safeParse(value);
  if (!result.success) report(result.error, fileName, false);

  /* Spans two situations, so it cannot sit on a field schema. */
  const seen = new Set<string>();
  for (const scenario of result.data.scenarios) {
    if (seen.has(scenario.id)) {
      throw new Error(`${fileName}: two scenarios share the id "${scenario.id}"`);
    }
    seen.add(scenario.id);
  }

  return result.data;
}
