/* npm run import -- content/restaurant.json

   Reads an import file, merges it into the pack in memory, loads the result and
   reports. Nothing is written yet.

   Validation is `loadPack(merged)` rather than a second set of rules: the same
   throws the app boots on, so the script cannot drift from what the app accepts.
   Nothing here checks the file's shape beyond that — whoever runs this wrote the
   file, and a misshapen one fails in the merge or the load with the reason.

   Minimal support for bad import help; keeping the scope small for now.
   */

import { readFileSync } from 'node:fs';

import { JA_FILE as PACK } from '../src/data/languages';
import { loadPack } from '../src/data/loadPack';
import {
  buildReport,
  formatReport,
} from './importReport';
import type { ImportFile } from './mergeImport';
import { mergeImport } from './mergeImport';

const PACK_PATH = 'src/data/ja.json';

function main(source: string | undefined): void {
  if (source === undefined) throw new Error('usage: npm run import -- <file.json>');

  /* Cast, not checked. The alternative is a parallel description of ImportFile
     that has to be kept in step with the real one, to buy a better message for
     a file the person at the keyboard just wrote. */
  const file = JSON.parse(readFileSync(source, 'utf8')) as ImportFile;
  const result = mergeImport(PACK, file);

  /* The real check. Throws naming the sentence — "restaurant 03 — "肉" is not
     in the lexicon" — which is the message worth surfacing verbatim. */
  loadPack(result.pack);

  console.log(formatReport(buildReport(PACK, file, result), { source, target: PACK_PATH }));
  console.log('\n  ✓ the merged pack loads');
}

try {
  main(process.argv[2]);
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
