/* en2ja: every tile in the library, authored once.

   This is the registry the exercises point into. A tile that three situations
   use is one row here listing all three, not three copies — この used to be
   written twice, once in each situation's word list, and は was re-typed at
   every one of the fourteen answers that needs it.

   `id` is the tile's type and its new-language text, colon-joined — which is
   also the key two authored tiles have to differ on to be different tiles.
   Writing it out rather than deriving it keeps the registry greppable: the id
   in an exercise's answer is the id you find here.

   `scenarioIds` records where a tile is used. It is not what a situation offers
   as a distractor — that is the situation's own `vocab` list — so a tile can
   sit in an answer without ever showing up as a wrong option elsewhere, which
   is exactly the case for クロワッサン and メロンパン below. */

import type { StoredTile } from '../schema';

export const EN2JA_TILES: readonly StoredTile[] = [
  /* The shared grammar pool: near-miss particles and endings that every
     situation draws distractors from. Listed on the pack, not on a scenario —
     see EN2JA_GRAMMAR_TILE_IDS. */
  { id: 'particle:は', newLanguageText: 'は', reading: 'wa', type: 'particle', scenarioIds: ['bakery', 'station'] },
  { id: 'particle:が', newLanguageText: 'が', reading: 'ga', type: 'particle', scenarioIds: ['bakery'] },
  { id: 'particle:を', newLanguageText: 'を', reading: 'o', type: 'particle', scenarioIds: ['bakery', 'station'] },
  { id: 'particle:に', newLanguageText: 'に', reading: 'ni', type: 'particle', scenarioIds: ['station'] },
  { id: 'particle:で', newLanguageText: 'で', reading: 'de', type: 'particle', scenarioIds: ['bakery'] },
  { id: 'particle:も', newLanguageText: 'も', reading: 'mo', type: 'particle', scenarioIds: [] },
  { id: 'particle:の', newLanguageText: 'の', reading: 'no', type: 'particle', scenarioIds: ['station'] },
  /* Station only, and only through an alternate answer: 渋谷へ行きたいです. */
  { id: 'particle:へ', newLanguageText: 'へ', reading: 'e', type: 'particle', scenarioIds: ['station'] },
  { id: 'particle:と', newLanguageText: 'と', reading: 'to', type: 'particle', scenarioIds: [] },
  { id: 'particle:か', newLanguageText: 'か', reading: 'ka', type: 'particle', scenarioIds: ['bakery', 'station'] },
  { id: 'particle:まで', newLanguageText: 'まで', reading: 'made', type: 'particle', scenarioIds: ['station'] },
  { id: 'particle:から', newLanguageText: 'から', reading: 'kara', type: 'particle', scenarioIds: [] },

  { id: 'ending:です', newLanguageText: 'です', reading: 'desu', type: 'ending', scenarioIds: ['bakery', 'station'] },
  { id: 'ending:ます', newLanguageText: 'ます', reading: 'masu', type: 'ending', scenarioIds: ['bakery', 'station'] },
  { id: 'ending:ました', newLanguageText: 'ました', reading: 'mashita', type: 'ending', scenarioIds: [] },
  { id: 'ending:ません', newLanguageText: 'ません', reading: 'masen', type: 'ending', scenarioIds: [] },
  { id: 'ending:たい', newLanguageText: 'たい', reading: 'tai', type: 'ending', scenarioIds: ['bakery', 'station'] },
  { id: 'ending:ている', newLanguageText: 'ている', reading: 'teiru', type: 'ending', scenarioIds: [] },

  /* Set phrases. Typed as verbs, following the architecture doc's own example
     of ください — they behave as the predicate of the sentence they end. */
  { id: 'verb:ください', newLanguageText: 'ください', reading: 'kudasai', type: 'verb', scenarioIds: ['bakery', 'station'] },
  { id: 'verb:お願いします', newLanguageText: 'お願いします', reading: 'onegaishimasu', type: 'verb', scenarioIds: ['bakery', 'station'] },
  { id: 'verb:あります', newLanguageText: 'あります', reading: 'arimasu', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:ありません', newLanguageText: 'ありません', reading: 'arimasen', type: 'verb', scenarioIds: [] },
  { id: 'verb:もらいます', newLanguageText: 'もらいます', reading: 'moraimasu', type: 'verb', scenarioIds: ['bakery'] },

  { id: 'question:どこ', newLanguageText: 'どこ', reading: 'doko', type: 'question', scenarioIds: ['station'] },
  { id: 'question:何', newLanguageText: '何', reading: 'nani', type: 'question', scenarioIds: ['bakery'] },

  /* Used by both situations. */
  { id: 'demonstrative:この', newLanguageText: 'この', reading: 'kono', type: 'demonstrative', scenarioIds: ['bakery', 'station'] },

  /* Bakery. */
  { id: 'noun:パン', newLanguageText: 'パン', reading: 'pan', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:クロワッサン', newLanguageText: 'クロワッサン', reading: 'kurowassan', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:メロンパン', newLanguageText: 'メロンパン', reading: 'meronpan', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:ケーキ', newLanguageText: 'ケーキ', reading: 'keeki', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:コーヒー', newLanguageText: 'コーヒー', reading: 'koohii', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:袋', newLanguageText: '袋', reading: 'fukuro', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:カード', newLanguageText: 'カード', reading: 'kaado', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:現金', newLanguageText: '現金', reading: 'genkin', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:もの', newLanguageText: 'もの', reading: 'mono', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:おすすめ', newLanguageText: 'おすすめ', reading: 'osusume', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'counter:一つ', newLanguageText: '一つ', reading: 'hitotsu', type: 'counter', scenarioIds: ['bakery'] },
  { id: 'counter:二つ', newLanguageText: '二つ', reading: 'futatsu', type: 'counter', scenarioIds: ['bakery'] },
  { id: 'counter:三つ', newLanguageText: '三つ', reading: 'mittsu', type: 'counter', scenarioIds: ['bakery'] },
  { id: 'demonstrative:これ', newLanguageText: 'これ', reading: 'kore', type: 'demonstrative', scenarioIds: ['bakery'] },
  { id: 'demonstrative:それ', newLanguageText: 'それ', reading: 'sore', type: 'demonstrative', scenarioIds: ['bakery'] },
  { id: 'demonstrative:あの', newLanguageText: 'あの', reading: 'ano', type: 'demonstrative', scenarioIds: ['bakery'] },
  { id: 'adjective:おいしい', newLanguageText: 'おいしい', reading: 'oishii', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'adjective:甘い', newLanguageText: '甘い', reading: 'amai', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'adjective:温かい', newLanguageText: '温かい', reading: 'atatakai', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'adjective:冷たい', newLanguageText: '冷たい', reading: 'tsumetai', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'verb:食べ', newLanguageText: '食べ', reading: 'tabe', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:飲み', newLanguageText: '飲み', reading: 'nomi', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:買い', newLanguageText: '買い', reading: 'kai', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:払え', newLanguageText: '払え', reading: 'harae', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'question:いくら', newLanguageText: 'いくら', reading: 'ikura', type: 'question', scenarioIds: ['bakery'] },

  /* Train station. */
  { id: 'noun:京都', newLanguageText: '京都', reading: 'kyouto', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:奈良', newLanguageText: '奈良', reading: 'nara', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:渋谷', newLanguageText: '渋谷', reading: 'shibuya', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:大阪行き', newLanguageText: '大阪行き', reading: 'oosaka-yuki', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:切符', newLanguageText: '切符', reading: 'kippu', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:電車', newLanguageText: '電車', reading: 'densha', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:新幹線', newLanguageText: '新幹線', reading: 'shinkansen', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:指定席', newLanguageText: '指定席', reading: 'shiteiseki', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:自由席', newLanguageText: '自由席', reading: 'jiyuuseki', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:改札', newLanguageText: '改札', reading: 'kaisatsu', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:出口', newLanguageText: '出口', reading: 'deguchi', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:次', newLanguageText: '次', reading: 'tsugi', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:明日', newLanguageText: '明日', reading: 'ashita', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:今日', newLanguageText: '今日', reading: 'kyou', type: 'noun', scenarioIds: ['station'] },
  { id: 'counter:一枚', newLanguageText: '一枚', reading: 'ichimai', type: 'counter', scenarioIds: ['station'] },
  { id: 'counter:二枚', newLanguageText: '二枚', reading: 'nimai', type: 'counter', scenarioIds: ['station'] },
  { id: 'counter:三枚', newLanguageText: '三枚', reading: 'sanmai', type: 'counter', scenarioIds: ['station'] },
  { id: 'verb:止まり', newLanguageText: '止まり', reading: 'tomari', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:出', newLanguageText: '出', reading: 'de', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:使え', newLanguageText: '使え', reading: 'tsukae', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:行き', newLanguageText: '行き', reading: 'iki', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:乗り', newLanguageText: '乗り', reading: 'nori', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:降り', newLanguageText: '降り', reading: 'ori', type: 'verb', scenarioIds: ['station'] },
  { id: 'question:何番線', newLanguageText: '何番線', reading: 'nanbansen', type: 'question', scenarioIds: ['station'] },
  { id: 'question:何時', newLanguageText: '何時', reading: 'nanji', type: 'question', scenarioIds: ['station'] },
];

/**
 * The shared distractor pool, as ids into the registry above — the same list
 * JA_GRAMMAR holds today, in the same order.
 */
export const EN2JA_GRAMMAR_TILE_IDS = [
  'particle:は',
  'particle:が',
  'particle:を',
  'particle:に',
  'particle:で',
  'particle:も',
  'particle:の',
  'particle:へ',
  'particle:と',
  'particle:か',
  'particle:まで',
  'particle:から',
  'ending:です',
  'ending:ます',
  'ending:ました',
  'ending:ません',
  'ending:たい',
  'ending:ている',
  'verb:ください',
  'verb:お願いします',
  'verb:あります',
  'verb:ありません',
  'verb:もらいます',
  'question:どこ',
  'question:何',
] as const;
