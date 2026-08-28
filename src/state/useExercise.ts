/* The seam for question-driven exercises.

   useTsumiki's opposite number, and deliberately its sibling rather than its
   replacement. The two do the same four things — resolve what is being asked,
   judge what the learner built, record it, tell the reducer — but over
   different material: useTsumiki over a SentenceItem and a generated bank, this
   over a compiled Question and a short list of choices.

   They share the reducer. `state` and `dispatch` arrive as arguments because
   useTsumiki owns the single useReducer in the app: a vocabulary set and a
   sentence set are the same set as far as the miss ladder and the score are
   concerned, and two stores would be two things to keep in agreement.

   Whether the two hooks should eventually be one is a real question and not
   this phase's to answer — the sentence drill carries accepted alternates and a
   generated bank, neither of which a Question has. It is written down to
   revisit once the other exercises exist. */

import { useCallback, useMemo, useRef } from 'react';

import { NOTE_AFTER_MISSES, REVEAL_AFTER_MISSES, VOCAB_CHOICES, VOCAB_SET_SIZE } from '../config';
import type { LanguagePack, Scenario, Tile } from '../data/types';
import { buildString } from '../lib/checkAnswer';
import type { ExerciseMode, Outcome } from '../lib/progress';
import { answerText } from '../lib/question';
import type { Question } from '../lib/question';
import { vocabQuestions } from '../lib/questions/vocab';
import { revealIndices } from '../lib/revealPlacement';
import type { ProgressStore } from '../storage/types';
import { isDone } from './appReducer';
import type { AppAction, AppState } from './appReducer';
import { fireAndForget } from './fireAndForget';

export interface Exercise {
  /** The whole compiled set. Empty when the running mode is not question-driven. */
  readonly questions: readonly Question[];
  /** The question on screen, or undefined when there is no set to run. */
  readonly question: Question | undefined;
  /** The tiles offered for it — this exercise's equivalent of the tile bank. */
  readonly choices: readonly Tile[];
  readonly total: number;
  readonly done: boolean;
  readonly isLastItem: boolean;
  readonly showNote: boolean;
  readonly showReveal: boolean;
  readonly progress: number;

  readonly tap: (index: number) => void;
  readonly untap: (position: number) => void;
  readonly check: () => void;
  readonly reveal: () => void;
  readonly next: () => void;
  readonly restart: () => void;
}

export interface ExerciseInput {
  readonly language: LanguagePack;
  readonly scenario: Scenario;
  /** Which exercise is running. `sentence` compiles to nothing — see below. */
  readonly mode: ExerciseMode;
  readonly state: AppState;
  readonly dispatch: (action: AppAction) => void;
  readonly progress?: ProgressStore | undefined;
}

/**
 * Compile the set for one mode.
 *
 * `sentence` yields nothing on purpose rather than throwing: this hook is
 * called unconditionally, as the rules of hooks require, so it has to have an
 * answer for the mode it does not drive.
 */
function compile(language: LanguagePack, scenario: Scenario, mode: ExerciseMode): Question[] {
  switch (mode) {
    case 'vocab':
      return vocabQuestions(language, scenario, VOCAB_SET_SIZE, VOCAB_CHOICES);
    /* Phases 2 and 3 add their compilers here. Each is one case and one file
       in lib/questions/ — nothing below this line changes for either. */
    case 'particle':
    case 'conjugation':
    case 'sentence':
      return [];
  }
}

export function useExercise({
  language,
  scenario,
  mode,
  state,
  dispatch,
  progress,
}: ExerciseInput): Exercise {
  /* Memoised for identity as much as for cost: React needs the same choices
     array back on the re-render caused by placing a tile, or every tile would
     remount and lose keyboard focus. */
  const questions = useMemo(() => compile(language, scenario, mode), [language, scenario, mode]);

  const question = questions[state.item];
  const choices = question?.choices ?? EMPTY;
  const total = questions.length;
  const done = isDone(state);

  /* When the current question went on screen, or when the last attempt on it
     settled. A ref rather than reducer state, because elapsed time is not a
     rule and appReducer must stay pure. */
  const presentedAt = useRef(Date.now());

  /* Restart the clock whenever a different question is on screen.

     useTsumiki keeps its own clock and resets it in the callbacks it owns, but
     this hook does not own the one that matters most: entering a set goes
     through useTsumiki.openExercise, which this hook never sees. Comparing a
     marker during render catches every way the question can change — opening,
     advancing, restarting — rather than enumerating them. Writing a ref during
     render is safe: it is not state, nothing re-renders from it, and running
     twice with the same marker does nothing. */
  const marker = `${mode}:${state.scenario}:${state.item}`;
  const shown = useRef(marker);
  if (shown.current !== marker) {
    shown.current = marker;
    presentedAt.current = Date.now();
  }

  /**
   * Write down one attempt.
   *
   * One row, against the question's own key, and **no `viaItem`** — that field
   * marks a row as inferred from something else, and this is the learner
   * answering the thing directly. A vocabulary question and the sentence drill
   * both write to `ja:tile:パン`; the difference between them is exactly this.
   */
  const record = useCallback(
    (outcome: Outcome) => {
      if (!progress || !question) return;

      const at = Date.now();
      const durationMs = at - presentedAt.current;
      presentedAt.current = at;

      fireAndForget(
        progress.recordAttempt({
          key: question.key,
          languageCode: language.code,
          unit: question.unit,
          mode: question.mode,
          scenarioId: question.scenarioId,
          at,
          durationMs,
          outcome,
          misses: state.misses,
        }),
      );
    },
    [progress, question, language.code, state.misses],
  );

  const present = useCallback(() => {
    presentedAt.current = Date.now();
  }, []);

  const tap = useCallback((index: number) => dispatch({ type: 'tap', bankIndex: index }), [dispatch]);
  const untap = useCallback(
    (position: number) => dispatch({ type: 'untap', position }),
    [dispatch],
  );

  const check = useCallback(() => {
    /* The reducer's own guards, mirrored — without them a check it ignores
       would still be written down as an attempt the learner never made. */
    if (!question || isDone(state) || state.placed.length === 0) return;

    const built = buildString(choices, state.placed, language.joiner);
    const right = built === answerText(question, language.joiner);

    record(right ? 'right' : 'wrong');
    dispatch({ type: 'check', correct: right });
  }, [question, state, choices, language.joiner, record, dispatch]);

  const reveal = useCallback(() => {
    if (!question || isDone(state)) return;
    record('shown');
    dispatch({ type: 'reveal', placed: revealIndices(question.answer, choices) });
  }, [question, state, choices, record, dispatch]);

  const next = useCallback(() => {
    present();
    dispatch({ type: 'next', itemCount: total });
  }, [total, present, dispatch]);

  const restart = useCallback(() => {
    present();
    dispatch({ type: 'restart' });
  }, [present, dispatch]);

  return {
    questions,
    question,
    choices,
    total,
    done,
    isLastItem: state.item === total - 1,
    /* A question with no note never shows one, however many misses there are.
       Vocabulary is the case: see the note on Question.note. */
    showNote: question?.note !== undefined && (state.misses >= NOTE_AFTER_MISSES || done),
    showReveal: state.misses >= REVEAL_AFTER_MISSES && !done,
    /* A finished set reads 100%, not "last question". */
    progress: total === 0 ? 0 : (state.finished ? total : state.item) / total,
    tap,
    untap,
    check,
    reveal,
    next,
    restart,
  };
}

/* One frozen empty array rather than a fresh literal, so a mode with no
   questions returns the same identity every render. */
const EMPTY: readonly Tile[] = [];
