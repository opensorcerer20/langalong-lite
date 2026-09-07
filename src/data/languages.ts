/* The language registry, and which language the app is currently drilling.

   Only useTsumiki reads LANGUAGE — it is the seam where content meets state, so
   nothing in lib/, state/appReducer or components/ ever imports a pack. That is
   what keeps them language-agnostic, and it is worth preserving: a component
   that reaches in here for a piece of Japanese has broken the arrangement. */

import JA_BAKERY from '../../content/ja/bakery.json';
import JA_CORE from '../../content/ja/core.json';
import JA_STATION from '../../content/ja/station.json';
import type { CoreFile, SituationFile } from './assemblePack';
import { assemblePack } from './assemblePack';
import { loadPack } from './loadPack';
import type { LanguagePack } from './types';

/**
 * The files the Japanese pack is made of.
 *
 * The situation list is the whole of what it takes to add one, and its order is
 * the set numbering — bakery is Set 01 because it is first here.
 *
 * Exported in pieces as well as assembled because `npm run import` checks a
 * candidate situation against exactly this list, and having it in two places is
 * how a situation ends up drilled but unchecked.
 */
export const JA_CONTENT: {
  readonly core: CoreFile;
  readonly situations: readonly SituationFile[];
} = { core: JA_CORE, situations: [JA_BAKERY, JA_STATION] };

/**
 * The Japanese pack, assembled and expanded.
 *
 * At module scope on purpose: a pack that will not load is a broken build, not
 * a broken drill, so it fails at import.
 */
export const JA: LanguagePack = loadPack(assemblePack(JA_CONTENT.core, JA_CONTENT.situations));

/** Every pack the app ships. Content tests run over all of them. */
export const LANGUAGES: readonly LanguagePack[] = [JA];

/**
 * The language the app drills.
 *
 * One line to change while there is one pack. Choosing between several at
 * runtime — a picker, and progress stored per language — is roadmap work.
 */
export const LANGUAGE: LanguagePack = JA;
