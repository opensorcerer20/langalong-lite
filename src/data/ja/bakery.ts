/* Set 01 — Bakery. Asking for items, counting them, paying at the counter.

   Tiles follow the project's granularity rule: whole words, particles split
   out, and conjugation endings as their own tile (食べ + たい). */

import type { SentenceItem, Tile } from '../types';

export const BAKERY_ITEMS: readonly SentenceItem[] = [
  {
    en: 'One bread, please.',
    ans: [['パン', 'pan'], ['を', 'o'], ['ください', 'kudasai']],
    alts: ['パンをお願いします'],
    note: 'を marks the direct object — the thing you are asking for. は would make it the topic, which sounds like you are commenting on bread, not requesting it.',
  },
  {
    en: "I'd like two croissants.",
    ans: [['クロワッサン', 'kurowassan'], ['を', 'o'], ['二つ', 'futatsu'], ['ください', 'kudasai']],
    note: 'The counter comes after を, not attached to the noun: ＸをNください. 二つ is the generic counter for small objects.',
  },
  {
    en: 'Do you have melon bread?',
    ans: [['メロンパン', 'meronpan'], ['は', 'wa'], ['あります', 'arimasu'], ['か', 'ka']],
    note: 'For existence questions the item is the topic, so は. か turns the sentence into a question — no rising intonation needed.',
  },
  {
    en: 'How much is this?',
    ans: [['これ', 'kore'], ['は', 'wa'], ['いくら', 'ikura'], ['です', 'desu'], ['か', 'ka']],
    note: "これ is 'this thing' on its own; この needs a noun after it (この パン).",
  },
  {
    en: 'Is this bread sweet?',
    ans: [['この', 'kono'], ['パン', 'pan'], ['は', 'wa'], ['甘い', 'amai'], ['です', 'desu'], ['か', 'ka']],
    note: '甘い is already an adjective — です only adds politeness, it never becomes 甘いだです or takes が here.',
  },
  {
    en: 'I want to eat something warm.',
    ans: [['温かい', 'atatakai'], ['もの', 'mono'], ['が', 'ga'], ['食べ', 'tabe'], ['たい', 'tai'], ['です', 'desu']],
    note: '〜たい takes が for its object, not を. Attach たい to the verb stem: 食べ + たい.',
  },
  {
    en: "I'll take this one.",
    ans: [['これ', 'kore'], ['を', 'o'], ['お願いします', 'onegaishimasu']],
    alts: ['これをください', 'これをもらいます'],
    note: 'お願いします is softer than ください at the point of paying. Both are fine; the particle stays を.',
  },
  {
    en: 'Can I pay by card?',
    ans: [['カード', 'kaado'], ['で', 'de'], ['払え', 'harae'], ['ます', 'masu'], ['か', 'ka']],
    note: "で marks the means or instrument — by card, by train, in Japanese. 払え+ます is the potential form: 'can pay'.",
  },
  {
    en: 'Please give me a bag.',
    ans: [['袋', 'fukuro'], ['を', 'o'], ['ください', 'kudasai']],
    note: 'Same frame as the first sentence. Once ＸをＹください is automatic, only the noun changes.',
  },
  {
    en: 'What do you recommend?',
    ans: [['おすすめ', 'osusume'], ['は', 'wa'], ['何', 'nani'], ['です', 'desu'], ['か', 'ka']],
    note: '何 stays where the answer would go — Japanese does not move question words to the front.',
  },
];

/** Bakery vocabulary. Distractors are drawn from here plus the grammar pool. */
export const BAKERY_WORDS: readonly Tile[] = [
  ['一つ', 'hitotsu'],
  ['二つ', 'futatsu'],
  ['三つ', 'mittsu'],
  ['これ', 'kore'],
  ['それ', 'sore'],
  ['この', 'kono'],
  ['あの', 'ano'],
  ['パン', 'pan'],
  ['ケーキ', 'keeki'],
  ['コーヒー', 'koohii'],
  ['袋', 'fukuro'],
  ['カード', 'kaado'],
  ['現金', 'genkin'],
  ['おいしい', 'oishii'],
  ['甘い', 'amai'],
  ['温かい', 'atatakai'],
  ['冷たい', 'tsumetai'],
  ['もの', 'mono'],
  ['食べ', 'tabe'],
  ['飲み', 'nomi'],
  ['買い', 'kai'],
  ['払え', 'harae'],
  ['いくら', 'ikura'],
  ['おすすめ', 'osusume'],
];
