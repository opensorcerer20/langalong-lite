/* The screen every question-driven exercise uses.

   DrillScreen's opposite number and the same kind of thing: composition only,
   every rule it appears to enforce living in appReducer and every flag it
   branches on computed in useExercise.

   It renders whatever a Question describes, so vocabulary, particles and
   conjugation are the same screen with different content — which is the point
   of compiling each of them to a Question rather than giving each a screen. */

import * as stylex from '@stylexjs/stylex';

import { NOTE_AFTER_MISSES, SHOW_READING } from '../config';
import type { LanguagePack } from '../data/types';
import type { Question } from '../lib/question';
import type { Exercise } from '../state/useExercise';
import { shared } from '../styles/shared';
import { ClozeLine } from './ClozeLine';
import { DrillActions } from './DrillActions';
import { GrammarNote } from './GrammarNote';
import { PromptBand } from './PromptBand';
import { StatusLine } from './StatusLine';
import { TileBank } from './TileBank';

export interface ExerciseScreenProps {
  readonly exercise: Exercise;
  readonly question: Question;
  readonly language: LanguagePack;
  /** Zero-based position in the set, for the counter. */
  readonly index: number;
  /** Misses on the current question, from the reducer. */
  readonly misses: number;
  /** Positions in `question.choices` the learner has placed. */
  readonly placed: readonly number[];
  readonly status: Parameters<typeof StatusLine>[0]['status'];
  /** What the learner is being asked to do, above the prompt. */
  readonly instruction: string;
}

export function ExerciseScreen({
  exercise,
  question,
  language,
  index,
  misses,
  placed,
  status,
  instruction,
}: ExerciseScreenProps) {
  const { choices, total, done, isLastItem, showNote, showReveal } = exercise;

  return (
    <section {...stylex.props(shared.screen)}>
      <PromptBand
        prompt={question.prompt}
        language={language.name}
        instruction={instruction}
        index={index}
        total={total}
      />

      {question.frame && (
        <ClozeLine
          frame={question.frame}
          choices={choices}
          placed={placed}
          showReading={SHOW_READING}
          locked={done}
          onRemove={exercise.untap}
        />
      )}

      <TileBank
        bank={choices}
        placed={placed}
        showReading={SHOW_READING}
        locked={done}
        onPlace={exercise.tap}
      />

      <StatusLine
        status={status}
        misses={misses}
        /* A question with no note must never be told to go and read one. The
           threshold it can never reach is how StatusLine stays unaware that a
           note is optional — see the note on Question.note. */
        noteAfterMisses={question.note === undefined ? Number.POSITIVE_INFINITY : NOTE_AFTER_MISSES}
      />

      {showNote && question.note !== undefined && <GrammarNote note={question.note} done={done} />}

      <DrillActions
        done={done}
        isLastItem={isLastItem}
        canCheck={placed.length > 0}
        showReveal={showReveal}
        onCheck={exercise.check}
        onNext={exercise.next}
        onReveal={exercise.reveal}
      />
    </section>
  );
}
