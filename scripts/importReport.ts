/* What an import did, and how to say it. Pure; the CLI prints what it returns.

   The report answers what a merge result alone cannot:

     lexicon      → how much of the vocabulary is genuinely new
     reused       → how much of the answer text the grammar pool already covers
     first taught → grammar this import is the first in the pack to teach

   The last is the one worth reading. `teaches` is declared per sentence, so
   nothing otherwise says whether new content broadens coverage or repeats it. */

import type { ImportFile, MergeResult } from './mergeImport';
import type { ItemEntry, PackFile } from '../src/data/loadPack';
import { TILE_SEPARATOR } from '../src/data/loadPack';

export interface ImportReport {
  readonly situationId: string;
  readonly situationName: string;
  /** `Set 03` — its position in the merged pack, the same way loadPack derives it. */
  readonly kicker: string;
  readonly created: boolean;
  readonly added: readonly string[];
  readonly skipped: readonly string[];
  /** Texts the import supplies a reading for that the pack did not have. */
  readonly lexiconNew: readonly string[];
  /** Texts the import restates, agreeing with the pack. Harmless, and worth seeing. */
  readonly lexiconPresent: readonly string[];
  /** Distinct tiles in the added answers that come from the shared grammar pool. */
  readonly reused: readonly string[];
  /** `teaches` ids no sentence already in the pack teaches. */
  readonly firstTaught: readonly string[];
  readonly wordsAdded: readonly string[];
}

export function buildReport(before: PackFile, file: ImportFile, result: MergeResult): ImportReport {
  const situation = result.pack.scenarios.find((entry) => entry.id === result.situationId);

  if (situation === undefined) {
    throw new Error(`merged pack has no situation "${result.situationId}"`);
  }

  const index = result.pack.scenarios.indexOf(situation);
  const added = new Set(result.added);
  const fresh = situation.items.filter((item) => added.has(item.id));

  const lexiconNew: string[] = [];
  const lexiconPresent: string[] = [];

  for (const text of Object.keys(file.lexicon)) {
    (before.lexicon[text] === undefined ? lexiconNew : lexiconPresent).push(text);
  }

  return {
    situationId: situation.id,
    situationName: situation.name,
    kicker: `Set ${String(index + 1).padStart(2, '0')}`,
    created: result.created,
    added: result.added,
    skipped: result.skipped,
    lexiconNew,
    lexiconPresent,
    reused: reusedFrom(fresh, before.grammar),
    firstTaught: firstTaughtBy(fresh, before),
    wordsAdded: result.wordsAdded,
  };
}

/** Distinct grammar-pool tiles the new answers lean on, in the order they appear. */
function reusedFrom(items: readonly ItemEntry[], grammar: readonly string[]): string[] {
  const pool = new Set(grammar);
  const seen = new Set<string>();

  for (const item of items) {
    for (const text of item.ans.split(TILE_SEPARATOR).map((segment) => segment.trim())) {
      if (pool.has(text)) seen.add(text);
    }
  }

  return [...seen];
}

/**
 * Grammar ids the import is the first to teach.
 *
 * Measured against the *whole* pack, not the situation — a particle taught in
 * the Bakery is not newly taught by mentioning it again in a Restaurant.
 */
function firstTaughtBy(items: readonly ItemEntry[], before: PackFile): string[] {
  const already = new Set(
    before.scenarios.flatMap((entry) => entry.items.flatMap((item) => item.teaches ?? [])),
  );
  const first = new Set<string>();

  for (const item of items) {
    for (const id of item.teaches ?? []) {
      if (!already.has(id)) first.add(id);
    }
  }

  return [...first];
}

export interface ReportContext {
  readonly source: string;
  readonly target: string;
}

/** The report as the CLI prints it. Read-only for now — step 2 adds `--write`. */
export function formatReport(report: ImportReport, context: ReportContext): string {
  const lines = [
    `${context.source} → ${context.target}   (dry run — nothing written)`,
    '',
    row('situation', `${report.situationId} "${report.situationName}" → ${report.kicker}` +
      (report.created ? ' (new)' : ' (existing)')),
    row('sentences', `${report.added.length} added`),
  ];

  if (report.skipped.length > 0) {
    lines.push(row('skipped', `${report.skipped.join(', ')} — already in the pack, left as they are`));
  }

  lines.push(
    row('lexicon', `+${report.lexiconNew.length} new, ${report.lexiconPresent.length} already present`),
    row('reused', `${report.reused.length} tiles already in the grammar pool`),
    row('first taught', report.firstTaught.length > 0 ? report.firstTaught.join(', ') : 'nothing new'),
  );

  if (report.wordsAdded.length > 0) {
    lines.push(row('extra words', report.wordsAdded.join(', ')));
  }

  if (report.skipped.length > 0) {
    lines.push('', 'Imports only add — edit src/data/ja.json to change a sentence it already has.');
  }

  return lines.join('\n');
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(14)}${value}`;
}
