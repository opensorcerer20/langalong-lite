/* Working out what the Japanese font has to cover. Pure; font.ts fetches.

   The vendored face is subset to the characters actually in use, so anything
   the pack gains that the subset lacks falls back to the OS Japanese font —
   which looks like a weight or shape mismatch between two tiles in one bank,
   not like a missing glyph.

   So the character set is derived from the whole pack, not from the tiles: a
   note reading "を marks the direct object" and a gloss reading "softer than に"
   put Japanese on the screen exactly as an answer does. */

import type { PackFile } from '../src/data/loadPack';

/**
 * Every Japanese character in a pack, deduped, in code-point order.
 *
 * Walks the file as JSON rather than field by field. Lexicon keys, answers,
 * notes, glosses and blurbs all end up on screen, and a field added later is
 * covered without anyone remembering to come back here.
 */
export function japaneseCharacters(pack: PackFile): string[] {
  /* Kana, CJK punctuation (、。〜), the main ideograph block, compatibility
     ideographs, and fullwidth forms. Latin is Archivo's job. */
  const japanese = /[　-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/gu;
  const found = new Set(JSON.stringify(pack).match(japanese) ?? []);

  return [...found].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
}

/**
 * The single woff2 url in a Google Fonts stylesheet.
 *
 * Matched on `format('woff2')` rather than on the url, which carries no
 * extension: a cut subset arrives as `fonts.gstatic.com/l/font?kit=…`.
 *
 * Asked for with a browser User-Agent, css2 returns exactly one variable woff2.
 * Asked for without, it returns nine static TrueType faces and no woff2 at all
 * — which is what an empty result here almost always means.
 */
export function woff2UrlIn(css: string): string {
  const pattern = /url\((https:\/\/[^)]+)\)\s*format\('woff2'\)/g;
  const urls = [...css.matchAll(pattern)].map((match) => match[1]!);

  if (urls.length === 1) return urls[0]!;

  throw new Error(
    urls.length === 0
      ? 'no woff2 in the stylesheet — css2 returns one only for a browser User-Agent, ' +
        'and nine static TrueType faces otherwise'
      : `the stylesheet offers ${urls.length} woff2 faces, and only one was expected`,
  );
}

/** What changed between the subset on disk and the one the pack now needs. */
export interface SubsetChange {
  readonly added: readonly string[];
  readonly removed: readonly string[];
}

export function compareSubsets(previous: readonly string[], next: readonly string[]): SubsetChange {
  const had = new Set(previous);
  const needs = new Set(next);

  return {
    added: next.filter((character) => !had.has(character)),
    removed: previous.filter((character) => !needs.has(character)),
  };
}
