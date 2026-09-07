/* npm run import -- content/ja/restaurant.json

   Checks one situation file and reports what it would add. Nothing is written:
   a situation joins the pack by being listed in src/data/languages.ts, and this
   says whether it is ready to be.

   Two checks, in order. contentSchema parses the file, since tsc has never seen
   it — that catches a missing field or a typo'd key with its path. Then
   loadPack runs on the pack the file would make, which is the same throw the app
   boots on, so the script cannot drift from what the app accepts. */

import { readFileSync } from 'node:fs';

import { JA_CONTENT } from '../src/data/languages';
import { loadPack } from '../src/data/loadPack';
import { parseSituationFile } from './contentSchema';
import { checkImport, formatReport } from './importCheck';

function main(source: string | undefined): void {
  if (source === undefined) throw new Error('usage: npm run import -- <situation.json>');

  const file = parseSituationFile(JSON.parse(readFileSync(source, 'utf8')), source);
  const { pack, report } = checkImport(JA_CONTENT.core, JA_CONTENT.situations, file);

  /* Throws naming the sentence — restaurant 03 — "肉" is not in the lexicon. */
  loadPack(pack);

  console.log(formatReport(report, source));
  console.log('\n  ✓ the pack loads with it');
}

try {
  main(process.argv[2]);
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
