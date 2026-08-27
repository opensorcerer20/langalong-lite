/* Composing the keys progress is stored against.

   Content ids are local: a scenario is 'bakery', a sentence inside it is '01'.
   That is deliberate — a globally-qualified id like 'ja.bakery.01' would put the
   language code on every line of ja/bakery.ts, and nothing inside ja/ is
   supposed to name Japanese. The pack's `code` already namespaces it, so the
   qualifying happens here instead, at the point the id leaves the content and
   becomes a database key.

   This module is pure and imports no content, like everything else in lib/. */

import type { Tile } from '../data/types';

/** What a stored row is about. */
export type ReviewUnit = 'item' | 'tile';

/* Segments never appear inside an id. The content tests reject a scenario or
   sentence id containing one, which is what lets parseKey split reliably. */
const SEPARATOR = ':';

/**
 * The key one drill sentence is stored under: `ja:item:bakery:01`.
 *
 * The unit sits in the second segment rather than being inferred from the
 * segment count, so a scenario that happened to be called "tile" could not be
 * mistaken for vocabulary.
 */
export function itemKey(languageCode: string, scenarioId: string, itemId: string): string {
  return [languageCode, 'item', scenarioId, itemId].join(SEPARATOR);
}

/**
 * The key one vocabulary tile is stored under: `ja:tile:パン`.
 *
 * Keyed on the tile's text, which is already its identity everywhere else in
 * the app — see the note on `Tile`. The reading is not part of the key: a tile
 * carries exactly one reading per pack, so including it would only add a way
 * for the same word to split across two rows.
 */
export function tileKey(languageCode: string, tile: Tile): string {
  return [languageCode, 'tile', tile[0]].join(SEPARATOR);
}

/** A key read back apart. */
export type ParsedKey =
  | { readonly unit: 'item'; readonly languageCode: string; readonly scenarioId: string; readonly itemId: string }
  | { readonly unit: 'tile'; readonly languageCode: string; readonly text: string };

/**
 * Read a key back into its parts, or `undefined` if it is not one.
 *
 * Undefined rather than a throw because the caller is usually reading rows out
 * of a database that may have been written by an older version of the app: an
 * unrecognised key is a row to skip, not a crash.
 */
export function parseKey(key: string): ParsedKey | undefined {
  const parts = key.split(SEPARATOR);
  const [languageCode, unit] = parts;
  if (!languageCode || !unit) return undefined;

  if (unit === 'item') {
    const [, , scenarioId, itemId, ...extra] = parts;
    if (!scenarioId || !itemId || extra.length > 0) return undefined;
    return { unit: 'item', languageCode, scenarioId, itemId };
  }

  if (unit === 'tile') {
    /* Everything after the unit is the text, rejoined rather than taken as one
       segment: a tile in a language written with punctuation could contain the
       separator, and it is always the final field. */
    const text = parts.slice(2).join(SEPARATOR);
    if (text === '') return undefined;
    return { unit: 'tile', languageCode, text };
  }

  return undefined;
}
