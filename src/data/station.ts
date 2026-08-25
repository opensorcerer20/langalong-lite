/* Set 02 — Train station. Buying tickets, platforms, departure times, gates. */

import type { SentenceItem, Tile } from './types';

export const STATION_ITEMS: readonly SentenceItem[] = [
  {
    en: 'Two tickets to Kyoto, please.',
    ans: [['京都', 'kyouto'], ['まで', 'made'], ['切符', 'kippu'], ['を', 'o'], ['二枚', 'nimai'], ['ください', 'kudasai']],
    note: "まで marks the end point of travel — 'as far as Kyoto'. 枚 is the counter for flat things: tickets, sheets, plates.",
  },
  {
    en: 'Which platform is the Osaka train?',
    ans: [['大阪行き', 'oosaka-yuki'], ['は', 'wa'], ['何番線', 'nanbansen'], ['です', 'desu'], ['か', 'ka']],
    note: "〜行き means 'bound for'. The whole phrase is the topic, so it takes は.",
  },
  {
    en: 'Does this train stop at Nara?',
    ans: [['この', 'kono'], ['電車', 'densha'], ['は', 'wa'], ['奈良', 'nara'], ['に', 'ni'], ['止まり', 'tomari'], ['ます', 'masu'], ['か', 'ka']],
    note: 'に marks the point a motion verb arrives at or stops at. で would mean the action happens there, not that it arrives there.',
  },
  {
    en: 'What time does the next train leave?',
    ans: [['次', 'tsugi'], ['の', 'no'], ['電車', 'densha'], ['は', 'wa'], ['何時', 'nanji'], ['に', 'ni'], ['出', 'de'], ['ます', 'masu'], ['か', 'ka']],
    note: "の joins two nouns: 次の電車, 'the next train'. Clock times take に.",
  },
  {
    en: "I'd like a reserved seat.",
    ans: [['指定席', 'shiteiseki'], ['を', 'o'], ['お願いします', 'onegaishimasu']],
    alts: ['指定席をください'],
    note: 'お願いします is the standard counter-window request. The object still takes を.',
  },
  {
    en: 'Where is the ticket gate?',
    ans: [['改札', 'kaisatsu'], ['は', 'wa'], ['どこ', 'doko'], ['です', 'desu'], ['か', 'ka']],
    note: 'Location questions follow Ｘはどこですか — は, not が, because you already know what you are looking for.',
  },
  {
    en: 'Can I use this ticket tomorrow?',
    ans: [['この', 'kono'], ['切符', 'kippu'], ['は', 'wa'], ['明日', 'ashita'], ['使え', 'tsukae'], ['ます', 'masu'], ['か', 'ka']],
    note: "使え+ます is the potential form, 'can use'. Time words like 明日 need no particle.",
  },
  {
    en: 'I want to go to Shibuya.',
    ans: [['渋谷', 'shibuya'], ['に', 'ni'], ['行き', 'iki'], ['たい', 'tai'], ['です', 'desu']],
    alts: ['渋谷へ行きたいです'],
    note: '〜たい attaches to the verb stem: 行き + たい. に marks the destination; へ is also correct and slightly softer.',
  },
];

/** Station vocabulary. Distractors are drawn from here plus the grammar pool. */
export const STATION_WORDS: readonly Tile[] = [
  ['一枚', 'ichimai'],
  ['二枚', 'nimai'],
  ['三枚', 'sanmai'],
  ['この', 'kono'],
  ['次', 'tsugi'],
  ['切符', 'kippu'],
  ['電車', 'densha'],
  ['新幹線', 'shinkansen'],
  ['何番線', 'nanbansen'],
  ['何時', 'nanji'],
  ['指定席', 'shiteiseki'],
  ['自由席', 'jiyuuseki'],
  ['改札', 'kaisatsu'],
  ['出口', 'deguchi'],
  ['京都', 'kyouto'],
  ['大阪行き', 'oosaka-yuki'],
  ['奈良', 'nara'],
  ['渋谷', 'shibuya'],
  ['明日', 'ashita'],
  ['今日', 'kyou'],
  ['止まり', 'tomari'],
  ['行き', 'iki'],
  ['出', 'de'],
  ['使え', 'tsukae'],
  ['乗り', 'nori'],
  ['降り', 'ori'],
];
