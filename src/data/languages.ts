/* The language registry, and which language the app is currently drilling.

   Only useTsumiki reads LANGUAGE — it is the seam where content meets state, so
   nothing in lib/, state/appReducer or components/ ever imports a pack. That is
   what keeps them language-agnostic, and it is worth preserving: a component
   that reaches in here for a piece of Japanese has broken the arrangement. */

import JA_BAKERY from '../../content/ja/bakery.json';
import JA_CORE from '../../content/ja/core.json';
import JA_STATION from '../../content/ja/station.json';
import { assemblePack } from './assemblePack';
import type { PackFile } from './loadPack';
import { loadPack } from './loadPack';
import type { LanguagePack } from './types';

/**
 * The Japanese content, assembled.
 *
 * The list is the whole of what it takes to add a situation, and its order is
 * the set numbering — bakery is Set 01 because it is first here.
 */
export const JA_FILE: PackFile = assemblePack(JA_CORE, [JA_BAKERY, JA_STATION]);

/**
 * The Japanese pack, expanded from that.
 *
 * At module scope on purpose: a pack that will not load is a broken build, not
 * a broken drill, so it fails at import.
 */
export const JA: LanguagePack = loadPack(JA_FILE);

/** Every pack the app ships. Content tests run over all of them. */
export const LANGUAGES: readonly LanguagePack[] = [JA];

/**
 * The language the app drills.
 *
 * One line to change while there is one pack. Choosing between several at
 * runtime — a picker, and progress stored per language — is roadmap work.
 */
export const LANGUAGE: LanguagePack = JA;
