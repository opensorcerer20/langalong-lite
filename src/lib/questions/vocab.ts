/* Compiling a situation's vocabulary into cloze questions.

   One sentence becomes one question: a content word is lifted out of it and
   offered back among plausible neighbours, with the English prompt saying what
   the sentence means. That shape is chosen over a bare flashcard on purpose —
   the word is always seen in the sentence it belongs to, and the tile-tapping
   is the one the learner already knows from the sentence drill.

   Which word is lifted is the sentence's *first* content word rather than a
   random one, so a set is reproducible and a failing test names a specific
   question. Vocabulary is derived, not authored — see lib/tags.ts.

   Pure, and imports no content: the pack and the situation arrive as
   arguments, like everywhere else in lib/. */

import type { LanguagePack, Scenario, Tile } from '../../data/types';
import { buildChoices } from '../buildChoices';
import { tileKey } from '../keys';
import type { Question } from '../question';
import { getVocabIn } from '../tags';

/**
 * Up to `size` cloze questions drawn from `scenario`.
 *
 * Returns fewer than `size` when the situation has fewer usable sentences,
 * which is honest: a short set is better than a padded one, and the caller
 * shows what it gets.
 *
 * @param choiceCount Tiles offered per question, the right one included.
 */
export function vocabQuestions(
  language: LanguagePack,
  scenario: Scenario,
  size: number,
  choiceCount: number,
): Question[] {
  const questions: Question[] = [];

  for (const item of scenario.items) {
    if (questions.length >= size) break;

    const vocab = getVocabIn(item, language.grammar);
    const answer = vocab[0];
    /* A sentence built entirely from the grammar pool has no word to be about.
       None ship today — tests/lib/tags.test.ts checks that — but a later
       sentence could, and skipping it is better than a question with a blank
       where its answer should be. */
    if (!answer) continue;

    const index = questions.length;

    questions.push({
      key: tileKey(language.code, answer),
      unit: 'tile',
      mode: 'vocab',
      scenarioId: scenario.id,
      prompt: item.en,
      frame: blankOut(item.ans, answer),
      choices: buildChoices(answer, distractorsFor(item.ans, answer, scenario), choiceCount, index),
      answer: [answer],
      /* No note. The sentence's note explains its grammar — を marking the
         direct object — which is not what a blanked-out word is testing, and
         explaining the wrong thing is worse than explaining nothing. The
         English prompt already carries the meaning. */
    });
  }

  return questions;
}

/** The sentence with every occurrence of `answer` replaced by a blank. */
function blankOut(ans: readonly Tile[], answer: Tile): readonly (Tile | null)[] {
  return ans.map((tile) => (tile[0] === answer[0] ? null : tile));
}

/**
 * The pool the wrong options come from: the situation's own vocabulary.
 *
 * Scene words rather than the grammar pool, because a question asking which
 * word means "bread" is not a question if the alternatives are particles. Tiles
 * still visible in the frame are excluded too — offering ください as a wrong
 * answer while it sits in the sentence two words away is a puzzle about
 * reading, not about vocabulary.
 */
function distractorsFor(
  ans: readonly Tile[],
  answer: Tile,
  scenario: Scenario,
): readonly Tile[] {
  const onScreen = new Set(ans.map((tile) => tile[0]));
  return scenario.words.filter((tile) => tile[0] !== answer[0] && !onScreen.has(tile[0]));
}
