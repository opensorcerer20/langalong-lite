/* Japanese: the particles, as declared things.

   Every tile here also appears in JA_GRAMMAR, and must stay identical to the
   entry there — the grammar pool is what the sentence drill draws distractors
   from, and its contents and order are pinned by the bank fixtures. This file
   adds what a bare tile in that pool cannot carry: an identity to store
   progress against, and which other particles are worth offering as the wrong
   answer. tests/data/ja.test.ts holds the two lists in step.

   `id` happens to match the tile's reading for all twelve of these, which is a
   coincidence of Japanese having no two particles that sound alike rather than
   a rule. It is a separate field because it is a storage key segment: fixed
   once shipped, latin, and free of the ":" that parseKey splits on.

   `confusedWith` is authored, not derived. Which particles compete is a fact
   about the language and about learners — が/は is the hardest pair in the
   language and に/で the second, and neither is visible in the texts. The
   pairs below are drawn from what the sentence notes already contrast. */

import type { Particle } from '../types';

export const JA_PARTICLES: readonly Particle[] = [
  {
    id: 'wa',
    tile: ['は', 'wa'],
    gloss: 'marks the topic — what the sentence is about',
    confusedWith: ['ga', 'mo', 'o'],
  },
  {
    id: 'ga',
    tile: ['が', 'ga'],
    gloss: 'marks the subject, and the object of 〜たい',
    confusedWith: ['wa', 'o', 'no'],
  },
  {
    id: 'o',
    tile: ['を', 'o'],
    gloss: 'marks the direct object — the thing acted on',
    confusedWith: ['ga', 'wa'],
  },
  {
    id: 'ni',
    tile: ['に', 'ni'],
    gloss: 'marks a destination, a point in time, or where something is',
    confusedWith: ['de', 'e'],
  },
  {
    id: 'de',
    tile: ['で', 'de'],
    gloss: 'marks the means, or where an action happens',
    confusedWith: ['ni'],
  },
  {
    id: 'mo',
    tile: ['も', 'mo'],
    gloss: 'replaces は or が to mean "too" or "also"',
    confusedWith: ['wa'],
  },
  {
    id: 'no',
    tile: ['の', 'no'],
    gloss: 'joins two nouns — possession, or one describing the other',
    confusedWith: ['ga'],
  },
  {
    id: 'e',
    tile: ['へ', 'e'],
    gloss: 'marks the direction of movement — softer than に',
    confusedWith: ['ni'],
  },
  {
    id: 'to',
    tile: ['と', 'to'],
    gloss: 'joins nouns as a complete list, or marks who with',
    /* Nothing in the pool competes with it. と/や is the pair worth drilling
       and や is not vocabulary yet; an empty set means the particle exercise
       skips this one rather than inventing an implausible distractor. */
    confusedWith: [],
  },
  {
    id: 'ka',
    tile: ['か', 'ka'],
    gloss: 'turns a sentence into a question',
    /* Sentence-final, so nothing sits in the same slot to be confused with. */
    confusedWith: [],
  },
  {
    id: 'made',
    tile: ['まで', 'made'],
    gloss: 'marks the end point — "as far as", "until"',
    confusedWith: ['kara'],
  },
  {
    id: 'kara',
    tile: ['から', 'kara'],
    gloss: 'marks the starting point — "from", "since"',
    confusedWith: ['made'],
  },
];
