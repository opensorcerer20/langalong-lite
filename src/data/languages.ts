/* The language registry, and which language the app is currently drilling.

   Only useTsumiki reads LANGUAGE — it is the seam where content meets state, so
   nothing in lib/, state/appReducer or components/ ever imports a pack. That is
   what keeps them language-agnostic, and it is worth preserving: a component
   that reaches in here for a piece of Japanese has broken the arrangement. */

import JA_FILE from './ja.json';
import { loadPack } from './loadPack';
import type { LanguagePack } from './types';

/**
 * The Japanese pack, expanded from its authored file.
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
