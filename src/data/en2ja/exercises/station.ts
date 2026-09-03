/* Set 02 — Train station. Buying tickets, platforms, departure times, gates.

   Same shape as bakery.ts: answers are tile ids into ../tiles.ts, canonical
   first, alternates as tile sequences rather than written-out strings. */

import type { StoredExercise } from '../../schema';

export const STATION_EXERCISES: readonly StoredExercise[] = [
  {
    id: 'station-01',
    scenarioId: 'station',
    promptText: 'Two tickets to Kyoto, please.',
    answerTileIds: [
      'noun:京都',
      'particle:まで',
      'noun:切符',
      'particle:を',
      'counter:二枚',
      'verb:ください',
    ],
    alternateAnswerTileIds: [],
    note: "まで marks the end point of travel — 'as far as Kyoto'. 枚 is the counter for flat things: tickets, sheets, plates.",
    tags: [],
  },
  {
    id: 'station-02',
    scenarioId: 'station',
    promptText: 'Which platform is the Osaka train?',
    answerTileIds: [
      'noun:大阪行き',
      'particle:は',
      'question:何番線',
      'ending:です',
      'particle:か',
    ],
    alternateAnswerTileIds: [],
    note: "〜行き means 'bound for'. The whole phrase is the topic, so it takes は.",
    tags: [],
  },
  {
    id: 'station-03',
    scenarioId: 'station',
    promptText: 'Does this train stop at Nara?',
    answerTileIds: [
      'demonstrative:この',
      'noun:電車',
      'particle:は',
      'noun:奈良',
      'particle:に',
      'verb:止まり',
      'ending:ます',
      'particle:か',
    ],
    alternateAnswerTileIds: [],
    note: 'に marks the point a motion verb arrives at or stops at. で would mean the action happens there, not that it arrives there.',
    tags: [],
  },
  {
    id: 'station-04',
    scenarioId: 'station',
    promptText: 'What time does the next train leave?',
    answerTileIds: [
      'noun:次',
      'particle:の',
      'noun:電車',
      'particle:は',
      'question:何時',
      'particle:に',
      'verb:出',
      'ending:ます',
      'particle:か',
    ],
    alternateAnswerTileIds: [],
    note: "の joins two nouns: 次の電車, 'the next train'. Clock times take に.",
    tags: [],
  },
  {
    id: 'station-05',
    scenarioId: 'station',
    promptText: "I'd like a reserved seat.",
    answerTileIds: ['noun:指定席', 'particle:を', 'verb:お願いします'],
    alternateAnswerTileIds: [['noun:指定席', 'particle:を', 'verb:ください']],
    note: 'お願いします is the standard counter-window request. The object still takes を.',
    tags: [],
  },
  {
    id: 'station-06',
    scenarioId: 'station',
    promptText: 'Where is the ticket gate?',
    answerTileIds: ['noun:改札', 'particle:は', 'question:どこ', 'ending:です', 'particle:か'],
    alternateAnswerTileIds: [],
    note: 'Location questions follow Ｘはどこですか — は, not が, because you already know what you are looking for.',
    tags: [],
  },
  {
    id: 'station-07',
    scenarioId: 'station',
    promptText: 'Can I use this ticket tomorrow?',
    answerTileIds: [
      'demonstrative:この',
      'noun:切符',
      'particle:は',
      'noun:明日',
      'verb:使え',
      'ending:ます',
      'particle:か',
    ],
    alternateAnswerTileIds: [],
    note: "使え+ます is the potential form, 'can use'. Time words like 明日 need no particle.",
    tags: [],
  },
  {
    id: 'station-08',
    scenarioId: 'station',
    promptText: 'I want to go to Shibuya.',
    answerTileIds: ['noun:渋谷', 'particle:に', 'verb:行き', 'ending:たい', 'ending:です'],
    /* The alternate swaps に for へ and changes nothing else — the one place へ
       is in play anywhere in the pack. */
    alternateAnswerTileIds: [
      ['noun:渋谷', 'particle:へ', 'verb:行き', 'ending:たい', 'ending:です'],
    ],
    note: '〜たい attaches to the verb stem: 行き + たい. に marks the destination; へ is also correct and slightly softer.',
    tags: [],
  },
];
