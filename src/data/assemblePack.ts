/* One core file plus one file per situation, in, a PackFile out.

     content/ja/core.json      shared: lexicon, grammar, particles, conjugations
     content/ja/bakery.json    one situation, and the readings its words need
     content/ja/station.json   ⋮
              │
              ▼  assemblePack()
           PackFile  ──loadPack──►  LanguagePack

   - Each situation file carries its own readings; they are merged here, and a
     disagreement throws.
   - Order is the caller's: position decides Set 01, Set 02, and so on.
   - Pure: languages.ts hands it parsed JSON. */

import type { PackFile, ScenarioEntry } from './loadPack';

type Lexicon = Readonly<Record<string, string>>;

/** Everything shared between scenarios. A PackFile without the content. */
export type CoreFile = Omit<PackFile, 'scenarios'>;

/** A scenario file: a scenario, plus the readings only it needs. */
export type ScenarioFile = ScenarioEntry & { readonly lexicon: Lexicon };

export function assemblePack(core: CoreFile, scenarios: readonly ScenarioFile[]): PackFile {
  let lexicon: Lexicon = core.lexicon;
  const seen = new Set<string>();

  for (const file of scenarios) {
    /* The id is the home screen's React key. */
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
 * Quietly taking one reading would show the wrong romaji under a tile in the
 * other situation. Repeating a reading identically is fine.
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

/** Unique within a scenario, so a load error names one sentence. */
function rejectRepeatedItemIds(scenario: ScenarioEntry): void {
  const seen = new Set<string>();

  for (const item of scenario.items) {
    if (seen.has(item.id)) {
      throw new Error(`"${scenario.id}" has two sentences with id "${item.id}"`);
    }
    seen.add(item.id);
  }
}
