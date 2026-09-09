/* One core file plus one file per situation, in, a PackFile out.

     content/ja/core.json      shared: lexicon, grammar, particles, conjugations
     content/ja/bakery.json    one situation, and the readings its words need
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

/** Everything shared between scenarios. A PackFile without the content. */
export type CoreFile = Omit<PackFile, 'scenarios'>;

/**
 * A scenario file: a scenario, plus the readings only it needs.
 *
 * The lexicon is the one thing a file adds to what the pack already holds —
 * everything else is the scenario itself, so it is written at the top level.
 */
export type ScenarioFile = ScenarioEntry & { readonly lexicon: Lexicon };

export function assemblePack(core: CoreFile, scenarios: readonly ScenarioFile[]): PackFile {
  let lexicon: Lexicon = core.lexicon;
  const seen = new Set<string>();

  for (const file of scenarios) {
    /* Ids are storage keys — two scenarios sharing one would merge a learner's
       progress across both. */
    if (seen.has(file.id)) throw new Error(`two scenario files both use the id "${file.id}"`);
    seen.add(file.id);

    rejectRepeatedItemIds(file);
    lexicon = mergeLexicon(lexicon, file.lexicon, file.id);
  }

  return { ...core, lexicon, scenarios: scenarios.map(withoutLexicon) };
}

/** The scenario as the pack holds it — everything the file has but its readings. */
function withoutLexicon(file: ScenarioFile): ScenarioEntry {
  const { lexicon: _lexicon, ...scenario } = file;
  return scenario;
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

/** Within a scenario an id must be unique: it is half of the progress key. */
function rejectRepeatedItemIds(scenario: ScenarioEntry): void {
  const seen = new Set<string>();

  for (const item of scenario.items) {
    if (seen.has(item.id)) {
      throw new Error(`"${scenario.id}" has two sentences with id "${item.id}"`);
    }
    seen.add(item.id);
  }
}
