/* The language registry, and which language the app is currently drilling.

   Only useTsumiki reads LANGUAGE — it is the seam where content meets state, so
   nothing in lib/, state/appReducer or components/ ever imports a pack. That is
   what keeps them language-agnostic, and it is worth preserving: a component
   that reaches in here for a piece of Japanese has broken the arrangement. */

/* `./ja` resolves to ja.json, not to ja/index.ts — a file shadows a directory
   of the same name. Explicit only while the conversion has both; the directory
   goes at step 9 and this becomes an import of the JSON. */
import { JA } from './ja/index';
import type { LanguagePack } from './types';

/** Every pack the app ships. Content tests run over all of them. */
export const LANGUAGES: readonly LanguagePack[] = [JA];

/**
 * The language the app drills.
 *
 * One line to change while there is one pack. Choosing between several at
 * runtime — a picker, and progress stored per language — is roadmap work.
 */
export const LANGUAGE: LanguagePack = JA;
