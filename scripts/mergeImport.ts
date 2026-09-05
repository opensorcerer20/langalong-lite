/* Merging an import file into a language pack. Pure; the CLI beside this file
   reads, writes and prints.

   Additive and repeatable — an import file stays in content/ as the record, so
   appending a sentence and re-running it has to be safe:

     situation already there    → its name and blurb win, words union
     sentence id already there  → left alone, and reported as skipped
     everything else            → appended

   An import therefore never changes what the pack already has; edit ja.json for
   that. Checks here cover only what a merge can break and loadPack cannot see —
   it already rejects missing readings, empty tiles and unknown `teaches` ids. */

import type { ItemEntry, PackFile, ScenarioEntry } from '../src/data/loadPack';

export type Lexicon = Readonly<Record<string, string>>;

/**
 * An import file declaring a situation and its sentences.
 *
 * If the pack has no situation with this id, it is created. If it has one, the
 * situation's own settings win and only the sentences are merged.
 */
export interface ScenarioImport {
  readonly lexicon: Lexicon;
  readonly scenario: ScenarioEntry;
}

/** The terse form: sentences for a situation, without restating it. */
export interface ItemsImport {
  readonly lexicon: Lexicon;
  readonly into: string;
  readonly items: readonly ItemEntry[];
}

export type ImportFile = ScenarioImport | ItemsImport;

/** What a merge did, so the caller can report it rather than guess. */
export interface MergeResult {
  readonly pack: PackFile;
  readonly situationId: string;
  /** The situation did not exist and this import created it. */
  readonly created: boolean;
  /** Sentence ids this import adds. */
  readonly added: readonly string[];
  /** Sentence ids the situation already had. Left exactly as they were. */
  readonly skipped: readonly string[];
  /** Distractor extras this import contributes, beyond those already listed. */
  readonly wordsAdded: readonly string[];
}

export function isScenarioImport(file: ImportFile): file is ScenarioImport {
  return 'scenario' in file;
}

/**
 * The pack with the import applied, and an account of what that did.
 *
 * Never mutates `pack` — the caller holds the original to compare against, and
 * a failed import must leave nothing half-applied.
 */
export function mergeImport(pack: PackFile, file: ImportFile): MergeResult {
  const lexicon = mergeLexicon(pack.lexicon, file.lexicon);

  if (isScenarioImport(file)) {
    const { scenario } = file;
    rejectRepeatedIds(scenario.items, scenario.id);

    const existing = pack.scenarios.find((situation) => situation.id === scenario.id);
    if (existing === undefined) {
      return {
        pack: { ...pack, lexicon, scenarios: [...pack.scenarios, scenario] },
        situationId: scenario.id,
        created: true,
        added: scenario.items.map((item) => item.id),
        skipped: [],
        wordsAdded: scenario.words ?? [],
      };
    }

    return mergeInto(pack, lexicon, existing, scenario.items, scenario.words ?? []);
  }

  const target = pack.scenarios.find((situation) => situation.id === file.into);
  if (target === undefined) {
    const known = pack.scenarios.map((situation) => `"${situation.id}"`).join(', ');
    throw new Error(`"into": "${file.into}" names no situation — the pack has ${known}`);
  }
  rejectRepeatedIds(file.items, target.id);

  return mergeInto(pack, lexicon, target, file.items, []);
}

/**
 * Fold sentences and extras into a situation the pack already has.
 *
 * The situation's `name` and `blurb` are untouched: they are its identity on
 * the home screen, and an import quietly renaming a situation is not something
 * anyone asks for. `words` is the exception and unions, because it is purely
 * additive — new sentences usually bring new distractor vocabulary, and nothing
 * is removed or rewritten by adding to it.
 */
function mergeInto(
  pack: PackFile,
  lexicon: Lexicon,
  target: ScenarioEntry,
  incoming: readonly ItemEntry[],
  extras: readonly string[],
): MergeResult {
  const present = new Set(target.items.map((item) => item.id));
  const fresh = incoming.filter((item) => !present.has(item.id));
  const skipped = incoming.filter((item) => present.has(item.id)).map((item) => item.id);

  const listed = target.words ?? [];
  const wordsAdded = extras.filter((word) => !listed.includes(word));
  const words = [...listed, ...wordsAdded];

  const merged: ScenarioEntry = {
    ...target,
    ...(words.length > 0 ? { words } : {}),
    items: [...target.items, ...fresh],
  };

  return {
    pack: {
      ...pack,
      lexicon,
      scenarios: pack.scenarios.map((situation) => (situation === target ? merged : situation)),
    },
    situationId: target.id,
    created: false,
    added: fresh.map((item) => item.id),
    skipped,
    wordsAdded,
  };
}

/**
 * The pack's lexicon with the import's entries folded in.
 *
 * A text the pack already reads one way and the import reads another is the one
 * merge conflict with consequences beyond this run: progress is keyed on the
 * text, so silently rewriting the reading would leave a learner's history
 * attached to a word that now reads differently.
 */
function mergeLexicon(pack: Lexicon, incoming: Lexicon): Lexicon {
  const merged: Record<string, string> = { ...pack };

  for (const [text, reading] of Object.entries(incoming)) {
    const shipped = pack[text];

    if (shipped !== undefined && shipped !== reading) {
      throw new Error(
        `"${text}" is read "${shipped}" in the pack but "${reading}" in the import — ` +
          `a text carries one reading, so change whichever is wrong`,
      );
    }
    merged[text] = reading;
  }

  return merged;
}

/**
 * Two sentences sharing an id *within one import* is an authoring slip, not a
 * re-run: one of them would be dropped and nothing would say which. A
 * collision with a sentence already in the pack is the repeatable case and is
 * skipped instead — see mergeInto.
 */
function rejectRepeatedIds(items: readonly ItemEntry[], where: string): void {
  const seen = new Set<string>();

  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`the import gives "${where}" two sentences with id "${item.id}"`);
    }
    seen.add(item.id);
  }
}
