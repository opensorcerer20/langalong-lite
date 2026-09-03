/* en2ja: every tile in the library, authored once.

   This is the registry the exercises point into. A tile that three situations
   use is one row here listing all three, not three copies — この used to be
   written twice, once in each situation's word list, and は was re-typed at
   every one of the fourteen answers that needs it.

   `id` is `type:l2`, which is also the key two authored tiles have to differ on
   to be different tiles. Writing it out rather than deriving it keeps the
   registry greppable: the id in an exercise's answer is the id you find here.

   `scenarioIds` records where a tile is used. It is not what a situation offers
   as a distractor — that is the situation's own `vocab` list — so a tile can
   sit in an answer without ever showing up as a wrong option elsewhere, which
   is exactly the case for クロワッサン and メロンパン below. */

import type { StoredTile } from '../schema';

export const EN2JA_TILES: readonly StoredTile[] = [
  /* The shared grammar pool: near-miss particles and endings that every
     situation draws distractors from. Listed on the pack, not on a scenario —
     see EN2JA_GRAMMAR_TILE_IDS. */
  { id: 'particle:は', l2: 'は', reading: 'wa', type: 'particle', scenarioIds: ['bakery', 'station'] },
  { id: 'particle:が', l2: 'が', reading: 'ga', type: 'particle', scenarioIds: ['bakery'] },
  { id: 'particle:を', l2: 'を', reading: 'o', type: 'particle', scenarioIds: ['bakery', 'station'] },
  { id: 'particle:に', l2: 'に', reading: 'ni', type: 'particle', scenarioIds: ['station'] },
  { id: 'particle:で', l2: 'で', reading: 'de', type: 'particle', scenarioIds: ['bakery'] },
  { id: 'particle:も', l2: 'も', reading: 'mo', type: 'particle', scenarioIds: [] },
  { id: 'particle:の', l2: 'の', reading: 'no', type: 'particle', scenarioIds: ['station'] },
  /* Station only, and only through an alternate answer: 渋谷へ行きたいです. */
  { id: 'particle:へ', l2: 'へ', reading: 'e', type: 'particle', scenarioIds: ['station'] },
  { id: 'particle:と', l2: 'と', reading: 'to', type: 'particle', scenarioIds: [] },
  { id: 'particle:か', l2: 'か', reading: 'ka', type: 'particle', scenarioIds: ['bakery', 'station'] },
  { id: 'particle:まで', l2: 'まで', reading: 'made', type: 'particle', scenarioIds: ['station'] },
  { id: 'particle:から', l2: 'から', reading: 'kara', type: 'particle', scenarioIds: [] },

  { id: 'ending:です', l2: 'です', reading: 'desu', type: 'ending', scenarioIds: ['bakery', 'station'] },
  { id: 'ending:ます', l2: 'ます', reading: 'masu', type: 'ending', scenarioIds: ['bakery', 'station'] },
  { id: 'ending:ました', l2: 'ました', reading: 'mashita', type: 'ending', scenarioIds: [] },
  { id: 'ending:ません', l2: 'ません', reading: 'masen', type: 'ending', scenarioIds: [] },
  { id: 'ending:たい', l2: 'たい', reading: 'tai', type: 'ending', scenarioIds: ['bakery', 'station'] },
  { id: 'ending:ている', l2: 'ている', reading: 'teiru', type: 'ending', scenarioIds: [] },

  /* Set phrases. Typed as verbs, following the architecture doc's own example
     of ください — they behave as the predicate of the sentence they end. */
  { id: 'verb:ください', l2: 'ください', reading: 'kudasai', type: 'verb', scenarioIds: ['bakery', 'station'] },
  { id: 'verb:お願いします', l2: 'お願いします', reading: 'onegaishimasu', type: 'verb', scenarioIds: ['bakery', 'station'] },
  { id: 'verb:あります', l2: 'あります', reading: 'arimasu', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:ありません', l2: 'ありません', reading: 'arimasen', type: 'verb', scenarioIds: [] },
  { id: 'verb:もらいます', l2: 'もらいます', reading: 'moraimasu', type: 'verb', scenarioIds: ['bakery'] },

  { id: 'question:どこ', l2: 'どこ', reading: 'doko', type: 'question', scenarioIds: ['station'] },
  { id: 'question:何', l2: '何', reading: 'nani', type: 'question', scenarioIds: ['bakery'] },

  /* Used by both situations. */
  { id: 'demonstrative:この', l2: 'この', reading: 'kono', type: 'demonstrative', scenarioIds: ['bakery', 'station'] },

  /* Bakery. */
  { id: 'noun:パン', l2: 'パン', reading: 'pan', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:クロワッサン', l2: 'クロワッサン', reading: 'kurowassan', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:メロンパン', l2: 'メロンパン', reading: 'meronpan', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:ケーキ', l2: 'ケーキ', reading: 'keeki', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:コーヒー', l2: 'コーヒー', reading: 'koohii', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:袋', l2: '袋', reading: 'fukuro', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:カード', l2: 'カード', reading: 'kaado', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:現金', l2: '現金', reading: 'genkin', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:もの', l2: 'もの', reading: 'mono', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'noun:おすすめ', l2: 'おすすめ', reading: 'osusume', type: 'noun', scenarioIds: ['bakery'] },
  { id: 'counter:一つ', l2: '一つ', reading: 'hitotsu', type: 'counter', scenarioIds: ['bakery'] },
  { id: 'counter:二つ', l2: '二つ', reading: 'futatsu', type: 'counter', scenarioIds: ['bakery'] },
  { id: 'counter:三つ', l2: '三つ', reading: 'mittsu', type: 'counter', scenarioIds: ['bakery'] },
  { id: 'demonstrative:これ', l2: 'これ', reading: 'kore', type: 'demonstrative', scenarioIds: ['bakery'] },
  { id: 'demonstrative:それ', l2: 'それ', reading: 'sore', type: 'demonstrative', scenarioIds: ['bakery'] },
  { id: 'demonstrative:あの', l2: 'あの', reading: 'ano', type: 'demonstrative', scenarioIds: ['bakery'] },
  { id: 'adjective:おいしい', l2: 'おいしい', reading: 'oishii', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'adjective:甘い', l2: '甘い', reading: 'amai', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'adjective:温かい', l2: '温かい', reading: 'atatakai', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'adjective:冷たい', l2: '冷たい', reading: 'tsumetai', type: 'adjective', scenarioIds: ['bakery'] },
  { id: 'verb:食べ', l2: '食べ', reading: 'tabe', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:飲み', l2: '飲み', reading: 'nomi', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:買い', l2: '買い', reading: 'kai', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'verb:払え', l2: '払え', reading: 'harae', type: 'verb', scenarioIds: ['bakery'] },
  { id: 'question:いくら', l2: 'いくら', reading: 'ikura', type: 'question', scenarioIds: ['bakery'] },

  /* Train station. */
  { id: 'noun:京都', l2: '京都', reading: 'kyouto', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:奈良', l2: '奈良', reading: 'nara', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:渋谷', l2: '渋谷', reading: 'shibuya', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:大阪行き', l2: '大阪行き', reading: 'oosaka-yuki', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:切符', l2: '切符', reading: 'kippu', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:電車', l2: '電車', reading: 'densha', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:新幹線', l2: '新幹線', reading: 'shinkansen', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:指定席', l2: '指定席', reading: 'shiteiseki', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:自由席', l2: '自由席', reading: 'jiyuuseki', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:改札', l2: '改札', reading: 'kaisatsu', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:出口', l2: '出口', reading: 'deguchi', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:次', l2: '次', reading: 'tsugi', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:明日', l2: '明日', reading: 'ashita', type: 'noun', scenarioIds: ['station'] },
  { id: 'noun:今日', l2: '今日', reading: 'kyou', type: 'noun', scenarioIds: ['station'] },
  { id: 'counter:一枚', l2: '一枚', reading: 'ichimai', type: 'counter', scenarioIds: ['station'] },
  { id: 'counter:二枚', l2: '二枚', reading: 'nimai', type: 'counter', scenarioIds: ['station'] },
  { id: 'counter:三枚', l2: '三枚', reading: 'sanmai', type: 'counter', scenarioIds: ['station'] },
  { id: 'verb:止まり', l2: '止まり', reading: 'tomari', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:出', l2: '出', reading: 'de', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:使え', l2: '使え', reading: 'tsukae', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:行き', l2: '行き', reading: 'iki', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:乗り', l2: '乗り', reading: 'nori', type: 'verb', scenarioIds: ['station'] },
  { id: 'verb:降り', l2: '降り', reading: 'ori', type: 'verb', scenarioIds: ['station'] },
  { id: 'question:何番線', l2: '何番線', reading: 'nanbansen', type: 'question', scenarioIds: ['station'] },
  { id: 'question:何時', l2: '何時', reading: 'nanji', type: 'question', scenarioIds: ['station'] },
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
