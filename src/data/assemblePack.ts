/* One core file plus one file per situation, in, a PackFile out.

     content/ja/core.json      shared: lexicon, grammar, particles, conjugations
     content/ja/bakery.json    its own readings + its own situation
     content/ja/station.json   ⋮
              │
              ▼  assemblePack()
           PackFile  ──loadPack──►  LanguagePack

   A situation file carries the readings for its own words, so adding one is
   writing one file rather than editing a shared one in three places. The
   lexicons are merged here, which is the only thing the split makes harder and
   the reason this throws on a disagreement.

   Order is the caller's: position decides Set 01, Set 02, and so on.

   Pure, and knows nothing about files — languages.ts hands it parsed JSON. */

import type { PackFile, ScenarioEntry } from './loadPack';

type Lexicon = Readonly<Record<string, string>>;

/** Everything shared between situations. A PackFile without the content. */
export type CoreFile = Omit<PackFile, 'scenarios'>;

/** One situation, and the readings only it needs. */
export interface SituationFile {
  readonly lexicon: Lexicon;
  readonly scenario: ScenarioEntry;
}

export function assemblePack(core: CoreFile, situations: readonly SituationFile[]): PackFile {
  let lexicon: Lexicon = core.lexicon;
  const seen = new Set<string>();

  for (const file of situations) {
    const { id } = file.scenario;

    /* Ids are storage keys — two situations sharing one would merge a
       learner's progress across both. */
    if (seen.has(id)) throw new Error(`two situation files both use the id "${id}"`);
    seen.add(id);

    rejectRepeatedItemIds(file.scenario);
    lexicon = mergeLexicon(lexicon, file.lexicon, id);
  }

  return { ...core, lexicon, scenarios: situations.map((file) => file.scenario) };
}

/**
 * Two lexicons as one, or a throw naming the disagreement.
 *
 * A text two files read differently is the one conflict the split introduces,
 * and it matters past this run: progress is keyed on the text, so quietly
 * taking one reading over the other would attach a learner's history to a word
 * that now reads differently. Repeating a reading identically is fine and
 * expected — 友達 belongs to every situation that uses it.
 */
function mergeLexicon(into: Lexicon, incoming: Lexicon, where: string): Lexicon {
  const merged: Record<string, string> = { ...into };

  for (const [text, reading] of Object.entries(incoming)) {
    const existing = into[text];

    if (existing !== undefined && existing !== reading) {
      throw new Error(
        `"${text}" is read "${existing}" already and "${reading}" in "${where}" — ` +
          `a text carries one reading, so change whichever is wrong`,
      );
    }
    merged[text] = reading;
  }

  return merged;
}

/** Within a situation an id must be unique: it is half of the progress key. */
function rejectRepeatedItemIds(scenario: ScenarioEntry): void {
  const seen = new Set<string>();

  for (const item of scenario.items) {
    if (seen.has(item.id)) {
      throw new Error(`"${scenario.id}" has two sentences with id "${item.id}"`);
    }
    seen.add(item.id);
  }
}
