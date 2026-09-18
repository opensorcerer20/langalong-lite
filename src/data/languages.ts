/* The language registry, and which language the app is currently drilling.

   Only main.tsx reads LANGUAGE and passes it down. lib/, state/ and
   components/ never import a pack, which keeps them language-agnostic. */

import JA_BAKERY from '../../content/ja/bakery.json';
import JA_CORE from '../../content/ja/core.json';
import JA_MEETING from '../../content/ja/meeting.json';
import JA_RESTAURANT from '../../content/ja/restaurant.json';
import JA_STATION from '../../content/ja/station.json';
import type { CoreFile, ScenarioFile } from './assemblePack';
import { assemblePack } from './assemblePack';
import { loadPack } from './loadPack';
import type { LanguagePack } from './types';

/**
 * The files the Japanese pack is made of.
 *
 * - Order is the set numbering: bakery is Set 01 because it is first.
 * - Exported unassembled too, because `npm run import` checks against this list.
 */
export const JA_CONTENT: {
  readonly core: CoreFile;
  readonly scenarios: readonly ScenarioFile[];
} = { core: JA_CORE, scenarios: [JA_BAKERY, JA_STATION, JA_RESTAURANT, JA_MEETING] };

/** At module scope on purpose: a pack that will not load fails at import. */
export const JA: LanguagePack = loadPack(assemblePack(JA_CONTENT.core, JA_CONTENT.scenarios));

/** Every pack the app ships. Content tests run over all of them. */
export const LANGUAGES: readonly LanguagePack[] = [JA];

/** The language the app drills. A runtime picker is roadmap work. */
export const LANGUAGE: LanguagePack = JA;
