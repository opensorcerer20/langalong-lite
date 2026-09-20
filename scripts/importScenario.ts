/* npm run import -- content/ja/restaurant.json

   Checks one situation file and reports what it would add. Writes nothing; a
   situation joins the pack by being listed in src/data/languages.ts.

   1. contentSchema: shape and typo'd keys.
   2. loadPack on the resulting pack: the same check the app boots with. */

import { readFileSync } from 'node:fs';

import { JA_CONTENT } from '../src/data/languages';
import { loadPack } from '../src/data/loadPack';
import { parseScenarioFile } from './contentSchema';
import { checkImport, formatReport } from './importCheck';

function main(source: string | undefined): void {
  if (source === undefined) throw new Error('usage: npm run import -- <situation.json>');

  const file = parseScenarioFile(JSON.parse(readFileSync(source, 'utf8')), source);
  const { pack, report } = checkImport(JA_CONTENT.core, JA_CONTENT.scenarios, file);

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
