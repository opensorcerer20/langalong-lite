/* Japanese: the inflected forms a verb can be drilled into.

   Declared here so a sentence can say which form it is teaching, and so a
   learner's record can be kept per pattern rather than only per sentence —
   "keeps getting て-form wrong" is a thing worth knowing and は/が tagging
   alone would never surface it.

   Only the patterns the current sentences actually exercise are listed. A
   pattern nothing teaches yet would be a row that can never be scored, which
   is worse than an absent one: it would read as a gap in the learner's
   knowledge rather than a gap in the content. Verb data itself — dictionary
   forms, groups, the tiles each form is built from — is not here; that arrives
   with the conjugation drill. */

import type { ConjugationPattern } from '../types';

/* Every pattern below applies to all three groups. Written out rather than
   defaulted because the field exists precisely for the ones that will not —
   the imperative and the volitional differ by group in ways these do not. */
const ALL_GROUPS = ['godan', 'ichidan', 'irregular'] as const;

export const JA_CONJUGATIONS: readonly ConjugationPattern[] = [
  {
    id: 'masu',
    name: 'polite non-past',
    verbGroups: ALL_GROUPS,
    note: 'Attach ます to the verb stem: 止まり + ます. This is the form to default to with anyone you are not close to.',
  },
  {
    id: 'mashita',
    name: 'polite past',
    verbGroups: ALL_GROUPS,
    note: 'The past of ます is ました, on the same stem: 止まり + ました. です does not take it — it becomes でした.',
  },
  {
    id: 'masen',
    name: 'polite negative',
    verbGroups: ALL_GROUPS,
    note: 'The negative of ます is ません, on the same stem: 止まり + ません. Nothing else in the sentence changes.',
  },
  {
    id: 'te-form',
    name: 'te-form',
    verbGroups: ALL_GROUPS,
    note: 'The connective form — it joins clauses and carries ている, てください and much else. Ichidan verbs take て on the stem; godan verbs change the ending by its final sound.',
  },
  {
    id: 'tai',
    name: 'want to',
    verbGroups: ALL_GROUPS,
    note: 'Attach たい to the verb stem: 食べ + たい. It behaves as an adjective afterwards, and its object takes が rather than を.',
  },
  {
    id: 'potential',
    name: 'potential',
    verbGroups: ALL_GROUPS,
    note: '"Can do" — 払え, 使え. What the verb could act on becomes が rather than を, because the potential describes a state rather than an action.',
  },
];
