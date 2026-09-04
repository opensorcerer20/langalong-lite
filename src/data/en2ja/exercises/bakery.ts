/* Set 01 — Bakery. Asking for items, counting them, paying at the counter.

   Every answer is a list of tile ids into ../tiles.ts, canonical answer first.
   The ids read as the sentence does — noun:パン, particle:を, verb:ください — so
   an answer can be checked against the prompt without a lookup.

   Alternates are tile sequences, not written-out strings. That is the change
   that matters here: パンをお願いします used to be stored as one string and split
   back into tiles at bank-building time, guessing at where the word boundaries
   were. Now the boundaries are the authored data. */

import type { StoredExercise } from '../../schema';

export const BAKERY_EXERCISES: readonly StoredExercise[] = [
  {
    id: 'bakery-01',
    scenarioId: 'bakery',
    promptText: 'One bread, please.',
    answerTileIds: ['noun:パン', 'particle:を', 'verb:ください'],
    alternateAnswerTileIds: [['noun:パン', 'particle:を', 'verb:お願いします']],
    note: 'を marks the direct object — the thing you are asking for. は would make it the topic, which sounds like you are commenting on bread, not requesting it.',
    tags: [],
  },
  {
    id: 'bakery-02',
    scenarioId: 'bakery',
    promptText: "I'd like two croissants.",
    answerTileIds: ['noun:クロワッサン', 'particle:を', 'counter:二つ', 'verb:ください'],
    alternateAnswerTileIds: [],
    note: 'The counter comes after を, not attached to the noun: ＸをNください. 二つ is the generic counter for small objects.',
    tags: [],
  },
  {
    id: 'bakery-03',
    scenarioId: 'bakery',
    promptText: 'Do you have melon bread?',
    answerTileIds: ['noun:メロンパン', 'particle:は', 'verb:あります', 'particle:か'],
    alternateAnswerTileIds: [],
    note: 'For existence questions the item is the topic, so は. か turns the sentence into a question — no rising intonation needed.',
    tags: [],
  },
  {
    id: 'bakery-04',
    scenarioId: 'bakery',
    promptText: 'How much is this?',
    answerTileIds: ['demonstrative:これ', 'particle:は', 'question:いくら', 'ending:です', 'particle:か'],
    alternateAnswerTileIds: [],
    note: "これ is 'this thing' on its own; この needs a noun after it (この パン).",
    tags: [],
  },
  {
    id: 'bakery-05',
    scenarioId: 'bakery',
    promptText: 'Is this bread sweet?',
    answerTileIds: [
      'demonstrative:この',
      'noun:パン',
      'particle:は',
      'adjective:甘い',
      'ending:です',
      'particle:か',
    ],
    alternateAnswerTileIds: [],
    note: '甘い is already an adjective — です only adds politeness, it never becomes 甘いだです or takes が here.',
    tags: [],
  },
  {
    id: 'bakery-06',
    scenarioId: 'bakery',
    promptText: 'I want to eat something warm.',
    answerTileIds: [
      'adjective:温かい',
      'noun:もの',
      'particle:が',
      'verb:食べ',
      'ending:たい',
      'ending:です',
    ],
    alternateAnswerTileIds: [],
    note: '〜たい takes が for its object, not を. Attach たい to the verb stem: 食べ + たい.',
    tags: [],
  },
  {
    id: 'bakery-07',
    scenarioId: 'bakery',
    promptText: "I'll take this one.",
    answerTileIds: ['demonstrative:これ', 'particle:を', 'verb:お願いします'],
    alternateAnswerTileIds: [
      ['demonstrative:これ', 'particle:を', 'verb:ください'],
      ['demonstrative:これ', 'particle:を', 'verb:もらいます'],
    ],
    note: 'お願いします is softer than ください at the point of paying. Both are fine; the particle stays を.',
    tags: [],
  },
  {
    id: 'bakery-08',
    scenarioId: 'bakery',
    promptText: 'Can I pay by card?',
    answerTileIds: ['noun:カード', 'particle:で', 'verb:払え', 'ending:ます', 'particle:か'],
    alternateAnswerTileIds: [],
    note: "で marks the means or instrument — by card, by train, in Japanese. 払え+ます is the potential form: 'can pay'.",
    tags: [],
  },
  {
    id: 'bakery-09',
    scenarioId: 'bakery',
    promptText: 'Please give me a bag.',
    answerTileIds: ['noun:袋', 'particle:を', 'verb:ください'],
    alternateAnswerTileIds: [],
    note: 'Same frame as the first sentence. Once ＸをＹください is automatic, only the noun changes.',
    tags: [],
  },
  {
    id: 'bakery-10',
    scenarioId: 'bakery',
    promptText: 'What do you recommend?',
    answerTileIds: ['noun:おすすめ', 'particle:は', 'question:何', 'ending:です', 'particle:か'],
    alternateAnswerTileIds: [],
    note: '何 stays where the answer would go — Japanese does not move question words to the front.',
    tags: [],
  },
];
