/* npm run font

   Regenerates fonts/noto-sans-jp-subset.woff2 to cover exactly the Japanese in
   the pack, plus a .txt of the characters so coverage is greppable.

   Run it after adding vocabulary. Skipping it does not break the build: a
   missing glyph falls back to the OS font, so one tile looks subtly off. */

import { readFileSync, writeFileSync } from 'node:fs';

import { assemblePack } from '../src/data/assemblePack';
import { JA_CONTENT } from '../src/data/languages';
import { compareSubsets, japaneseCharacters, woff2UrlIn } from './fontSubset';

const WOFF2_PATH = 'fonts/noto-sans-jp-subset.woff2';
const TEXT_PATH = 'fonts/noto-sans-jp-subset.txt';

/* Without a browser User-Agent, css2 serves nine static TrueType faces instead
   of one variable woff2. The most breakable thing here. */
const BROWSER =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0 Safari/537.36';

async function main(): Promise<void> {
  const characters = japaneseCharacters(assemblePack(JA_CONTENT.core, JA_CONTENT.scenarios));
  const text = characters.join('');

  const previous = previousCharacters();
  const { added, removed } = compareSubsets(previous, characters);

  console.log(`\n  characters   ${characters.length}`);
  if (previous.length === 0)
    console.log('  previously   nothing recorded — this run establishes it');
  if (previous.length > 0 && added.length > 0) console.log(`  added        ${added.join('')}`);
  if (previous.length > 0 && removed.length > 0) console.log(`  no longer    ${removed.join('')}`);

  const font = await download(text);

  writeFileSync(WOFF2_PATH, font);
  writeFileSync(TEXT_PATH, `${text}\n`);

  console.log(`\n  ${WOFF2_PATH}   ${(font.length / 1024).toFixed(1)} kB`);
  console.log(`  ${TEXT_PATH}    the exact text= this was built from\n`);
}

/** The subset on disk, or nothing the first time this runs. */
function previousCharacters(): string[] {
  try {
    return [...readFileSync(TEXT_PATH, 'utf8').trim()];
  } catch {
    return [];
  }
}

/**
 * The variable woff2 Google Fonts cuts for exactly these characters.
 *
 * Checked for the woff2 signature before writing, so an error page can never
 * replace the vendored font.
 */
async function download(text: string): Promise<Buffer> {
  const query = new URLSearchParams({ family: 'Noto Sans JP:wght@100..900', text });
  const css = await get(`https://fonts.googleapis.com/css2?${query.toString()}`, 'text');
  const font = await get(woff2UrlIn(css), 'buffer');

  if (font.subarray(0, 4).toString('latin1') !== 'wOF2') {
    throw new Error(`what came back from Google Fonts is not a woff2 (${font.length} bytes)`);
  }

  return font;
}

async function get(url: string, as: 'text'): Promise<string>;
async function get(url: string, as: 'buffer'): Promise<Buffer>;
async function get(url: string, as: 'text' | 'buffer'): Promise<string | Buffer> {
  const response = await fetch(url, { headers: { 'User-Agent': BROWSER } });

  if (!response.ok) throw new Error(`${url} answered ${response.status} ${response.statusText}`);

  return as === 'text' ? response.text() : Buffer.from(await response.arrayBuffer());
}

main().catch((error: unknown) => {
  console.error(`\n${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
