/* What a situation file would do to the pack, and how to say it.

   Pure. The CLI beside this file reads, prints and exits.

   A candidate is checked *in place*: if the pack already has a situation with
   its id, the file stands in for that one rather than being appended. So the
   same command answers both questions —

     before wiring it in   what would this add?
     after wiring it in    is this file still sound?

   — and neither is a duplicate-id error. Nothing is written either way; a
   situation joins the pack by being listed in src/data/languages.ts. */

import type { CoreFile, ScenarioFile } from '../src/data/assemblePack';
import { assemblePack } from '../src/data/assemblePack';
import type { ItemEntry, PackFile } from '../src/data/loadPack';
import { TILE_SEPARATOR } from '../src/data/loadPack';

export interface ImportReport {
  readonly situationId: string;
  readonly situationName: string;
  /** `03` — where it lands, derived the same way loadPack derives it. */
  readonly lessonNum: string;
  /** The pack already lists this id, so the file replaces it rather than adding. */
  readonly replacing: boolean;
  readonly sentences: number;
  /** Texts this file gives a reading the rest of the pack does not have. */
  readonly lexiconNew: readonly string[];
  /** Texts it restates, agreeing with the pack. Harmless, and worth seeing. */
  readonly lexiconPresent: readonly string[];
  /** Distinct tiles in its answers drawn from the shared grammar pool. */
  readonly reused: readonly string[];
  /** `teaches` ids no other situation teaches. */
  readonly firstTaught: readonly string[];
  /** Distractors it lists beyond what its own answers supply. */
  readonly extraWords: readonly string[];
}

export interface ImportCheck {
  /** The pack as it would be. Hand it to loadPack — that is the real check. */
  readonly pack: PackFile;
  readonly report: ImportReport;
}

export function checkImport(
  core: CoreFile,
  scenarios: readonly ScenarioFile[],
  candidate: ScenarioFile,
): ImportCheck {
  const others = scenarios.filter((file) => file.id !== candidate.id);
  const replacing = others.length < scenarios.length;

  /* Replacing keeps the situation's position, so its set number does not move
     just because the file was re-checked. */
  const withCandidate = replacing
    ? scenarios.map((file) => (file.id === candidate.id ? candidate : file))
    : [...scenarios, candidate];

  /* Measured against the pack without this situation at all — otherwise a
     re-check of a wired-in file would report that it teaches nothing new. */
  const before = assemblePack(core, others);

  return {
    pack: assemblePack(core, withCandidate),
    report: {
      situationId: candidate.id,
      situationName: candidate.name,
      lessonNum: String(withCandidate.indexOf(candidate) + 1).padStart(2, '0'),
      replacing,
      sentences: candidate.items.length,
      ...splitLexicon(candidate.lexicon, before.lexicon),
      reused: reusedFrom(candidate.items, core.grammar),
      firstTaught: firstTaughtBy(candidate.items, others),
      extraWords: candidate.words ?? [],
    },
  };
}

function splitLexicon(
  candidate: Readonly<Record<string, string>>,
  before: Readonly<Record<string, string>>,
): { lexiconNew: string[]; lexiconPresent: string[] } {
  const lexiconNew: string[] = [];
  const lexiconPresent: string[] = [];

  for (const text of Object.keys(candidate)) {
    (before[text] === undefined ? lexiconNew : lexiconPresent).push(text);
  }

  return { lexiconNew, lexiconPresent };
}

/** Distinct grammar-pool tiles the answers lean on, in the order they appear. */
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
 * Grammar ids no other situation teaches.
 *
 * The line worth reading: `teaches` is declared per sentence, so nothing else
 * says whether a new situation broadens the pack's coverage or repeats it.
 */
function firstTaughtBy(items: readonly ItemEntry[], others: readonly ScenarioFile[]): string[] {
  const already = new Set(
    others.flatMap((file) => file.items.flatMap((item) => item.teaches ?? [])),
  );
  const first = new Set<string>();

  for (const item of items) {
    for (const id of item.teaches ?? []) {
      if (!already.has(id)) first.add(id);
    }
  }

  return [...first];
}

/** The report as the CLI prints it. */
export function formatReport(report: ImportReport, source: string): string {
  const lines = [
    `${source}`,
    '',
    row('situation', `${report.situationId} "${report.situationName}" → Set ${report.lessonNum}`),
    row('sentences', String(report.sentences)),
    row(
      'lexicon',
      `+${report.lexiconNew.length} new, ${report.lexiconPresent.length} already present`,
    ),
    row('reused', `${report.reused.length} tiles already in the grammar pool`),
    row(
      'first taught',
      report.firstTaught.length > 0 ? report.firstTaught.join(', ') : 'nothing new',
    ),
  ];

  if (report.extraWords.length > 0) {
    lines.push(row('extra words', report.extraWords.join(', ')));
  }

  lines.push(
    '',
    report.replacing
      ? '  Already listed in src/data/languages.ts.'
      : '  Not listed in src/data/languages.ts yet — add it there to drill it.',
  );

  return lines.join('\n');
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(14)}${value}`;
}
