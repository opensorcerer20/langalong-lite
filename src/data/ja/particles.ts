/* Japanese: the particles, as declared things.

   Every tile here also appears in JA_GRAMMAR, and must stay identical to the
   entry there — the grammar pool is what the sentence drill draws distractors
   from. This file adds what a bare tile in that pool cannot carry: an identity
   to store progress against, and a gloss. tests/data/languages.test.ts holds
   the two lists in step.

   `id` happens to match the tile's reading for all twelve of these, which is a
   coincidence of Japanese having no two particles that sound alike rather than
   a rule. It is a separate field because it is a storage key segment: fixed
   once shipped, latin, and free of the ":" that parseKey splits on. */

import type { Particle } from '../types';

export const JA_PARTICLES: readonly Particle[] = [
  {
    id: 'wa',
    tile: ['は', 'wa'],
    gloss: 'marks the topic — what the sentence is about',
  },
  {
    id: 'ga',
    tile: ['が', 'ga'],
    gloss: 'marks the subject, and the object of 〜たい',
  },
  {
    id: 'o',
    tile: ['を', 'o'],
    gloss: 'marks the direct object — the thing acted on',
  },
  {
    id: 'ni',
    tile: ['に', 'ni'],
    gloss: 'marks a destination, a point in time, or where something is',
  },
  {
    id: 'de',
    tile: ['で', 'de'],
    gloss: 'marks the means, or where an action happens',
  },
  {
    id: 'mo',
    tile: ['も', 'mo'],
    gloss: 'replaces は or が to mean "too" or "also"',
  },
  {
    id: 'no',
    tile: ['の', 'no'],
    gloss: 'joins two nouns — possession, or one describing the other',
  },
  {
    id: 'e',
    tile: ['へ', 'e'],
    gloss: 'marks the direction of movement — softer than に',
  },
  {
    id: 'to',
    tile: ['と', 'to'],
    gloss: 'joins nouns as a complete list, or marks who with',
  },
  {
    id: 'ka',
    tile: ['か', 'ka'],
    gloss: 'turns a sentence into a question',
  },
  {
    id: 'made',
    tile: ['まで', 'made'],
    gloss: 'marks the end point — "as far as", "until"',
  },
  {
    id: 'kara',
    tile: ['から', 'kara'],
    gloss: 'marks the starting point — "from", "since"',
  },
];
