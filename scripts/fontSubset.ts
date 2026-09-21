/* Working out what the Japanese font has to cover. Pure; font.ts fetches. */

import type { PackFile } from '../src/data/loadPack';

/**
 * Every Japanese character in a pack, deduped, in code-point order.
 *
 * Scans the whole file as JSON, not just the tiles: notes show Japanese too,
 * and a field added later is covered automatically.
 */
export function japaneseCharacters(pack: PackFile): string[] {
  /* Kana, CJK punctuation, ideographs, fullwidth forms. Latin is Archivo's job.

     Escapes, not the characters: U+3000 is invisible, and U+F900 looks like
     U+8C48 — typing that one widens the class by ~20k code points silently. */
  const japanese = /[\u3000-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/gu;
  const found = new Set(JSON.stringify(pack).match(japanese) ?? []);

  return [...found].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
}

/**
 * The single woff2 url in a Google Fonts stylesheet.
 *
 * Matched on `format('woff2')`: a subset's url has no file extension.
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
