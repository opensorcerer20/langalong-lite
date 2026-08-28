/* One thing asked of the learner, in the shape every exercise but the sentence
   drill uses.

   The point of a single shape is that one screen renders all of them and one
   hook drives all of them: an exercise is then a *compiler* from content to
   questions — see lib/questions/ — rather than a screen, a hook and a set of
   rules of its own. Adding particle practice or conjugation drills is adding a
   compiler.

   The sentence drill is deliberately not one of these yet. It has accepted
   alternates and a generated bank rather than a short list of choices, and it
   was working before any of this existed; folding it in is a question to
   settle once the other modes are real, not while building the first one.

   Pure and content-free like everything in lib/: this file imports the shapes
   it needs and no content whatsoever. */

import type { Tile } from '../data/types';
import type { ReviewUnit } from './keys';
import type { ExerciseMode } from './progress';

export interface Question {
  /**
   * The storage key for the thing being reviewed — composed by lib/keys.ts.
   *
   * The question carries its own key rather than the hook deriving one because
   * a review mix will eventually draw questions from several situations at
   * once, at which point there is no single scenario for a hook to key on.
   */
  readonly key: string;
  readonly unit: ReviewUnit;
  readonly mode: ExerciseMode;
  /** The situation this question was drawn from. Recorded on every attempt. */
  readonly scenarioId: string;
  /** What the learner is being asked, in English. */
  readonly prompt: string;
  /**
   * The target-language sentence the answer drops into, as tiles, with `null`
   * marking each slot the learner fills.
   *
   * Absent when the question is not about a sentence — a conjugation drill
   * asks for a form of a verb, with no surrounding sentence to sit in.
   */
  readonly frame?: readonly (Tile | null)[];
  /** The tiles offered, exactly one arrangement of which is right. */
  readonly choices: readonly Tile[];
  /** The tiles that answer it, in order. Several for a multi-tile form. */
  readonly answer: readonly Tile[];
  /**
   * The explanation shown once the miss ladder reaches it.
   *
   * Absent when the content has nothing to say about *this* question, which is
   * the case for vocabulary: a sentence's note explains its grammar, so
   * showing it under a blanked-out word would explain something the learner
   * was not asked about. An absent note means no note, not a blank one.
   */
  readonly note?: string;
}

/** The answer as one string, for comparing against what the learner built. */
export function answerText(question: Question, joiner: string): string {
  return question.answer.map((tile) => tile[0]).join(joiner);
}
