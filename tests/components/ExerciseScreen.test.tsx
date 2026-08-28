/* ExerciseScreen is composition only, so these check that it wires a Question
   through to the right pieces — not the exercise rules, which live in
   appReducer and are tested there.

   The view model is a plain stand-in rather than a real useExercise, for the
   same reason DrillScreen's tests use one: a test that derived `showNote` from
   the state it passed in would be asserting that the helper can compare two
   numbers, not that the screen is wired correctly. */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ExerciseScreen } from '../../src/components/ExerciseScreen';
import type { LanguagePack, Tile } from '../../src/data/types';
import type { Question } from '../../src/lib/question';
import type { Exercise } from '../../src/state/useExercise';

const CHOICES: readonly Tile[] = [
  ['袋', 'fukuro'],
  ['パン', 'pan'],
  ['これ', 'kore'],
  ['ケーキ', 'keeki'],
];

const QUESTION: Question = {
  key: 'ja:tile:パン',
  unit: 'tile',
  mode: 'vocab',
  scenarioId: 'bakery',
  prompt: 'One bread, please.',
  frame: [null, ['を', 'o'], ['ください', 'kudasai']],
  choices: CHOICES,
  answer: [['パン', 'pan']],
};

const LANGUAGE: LanguagePack = {
  code: 'ja',
  name: 'Japanese',
  joiner: '',
  fontStack: "'Noto Sans JP'",
  grammar: [],
  particles: [],
  conjugations: [],
  scenarios: [],
};

function exercise(over: Partial<Exercise> = {}): Exercise {
  return {
    questions: [QUESTION],
    question: QUESTION,
    choices: CHOICES,
    total: 6,
    done: false,
    isLastItem: false,
    showNote: false,
    showReveal: false,
    progress: 0,
    tap: vi.fn(),
    untap: vi.fn(),
    check: vi.fn(),
    reveal: vi.fn(),
    next: vi.fn(),
    restart: vi.fn(),
    ...over,
  };
}

function show(
  over: Partial<Exercise> = {},
  props: Partial<Parameters<typeof ExerciseScreen>[0]> = {},
) {
  const view = exercise(over);
  render(
    <ExerciseScreen
      exercise={view}
      question={QUESTION}
      language={LANGUAGE}
      index={0}
      misses={0}
      placed={[]}
      status="idle"
      instruction="Choose the missing word"
      {...props}
    />,
  );
  return view;
}

describe('ExerciseScreen', () => {
  it('asks the question, with the instruction for this exercise', () => {
    show();
    expect(screen.getByRole('heading')).toHaveTextContent('One bread, please.');
    expect(screen.getByText(/Choose the missing word — item 1 of 6/)).toBeInTheDocument();
  });

  it('shows the sentence with its gap, and the options underneath', () => {
    show();
    expect(document.querySelectorAll('[data-blank]')).toHaveLength(1);
    expect(document.querySelectorAll('[data-variant="bank"]')).toHaveLength(CHOICES.length);
  });

  it('places an option when it is tapped', async () => {
    const view = show();
    await userEvent.click(screen.getByText('ケーキ'));
    expect(view.tap).toHaveBeenCalledWith(3);
  });

  /* The chosen tile is on screen twice: in the gap, and in the bank where it
     is hidden but still laid out so the options do not reflow. The gap is the
     one that responds, so the query has to say which. */
  it('takes a placed option back when the gap is tapped', async () => {
    const view = show({}, { placed: [1] });
    await userEvent.click(document.querySelector('[data-variant="placed"]') as HTMLElement);
    expect(view.untap).toHaveBeenCalledWith(0);
  });

  it('checks the answer from the primary button', async () => {
    const view = show({}, { placed: [1] });
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(view.check).toHaveBeenCalledOnce();
  });

  it('advances once the answer is settled', async () => {
    const view = show({ done: true });
    await userEvent.click(screen.getByRole('button', { name: 'Next sentence' }));
    expect(view.next).toHaveBeenCalledOnce();
  });

  it('offers the answer when the view model says so', async () => {
    const view = show({ showReveal: true });
    await userEvent.click(screen.getByRole('button', { name: /show me the answer/i }));
    expect(view.reveal).toHaveBeenCalledOnce();
  });

  describe('a question with no note', () => {
    /* Vocabulary carries none: the sentence's note explains its grammar, which
       is not what a blanked-out word is testing. */
    it('shows no note even when the view model would allow one', () => {
      show({ showNote: true });
      expect(screen.queryByText('Grammar')).not.toBeInTheDocument();
    });

    /* The status line must not send the learner to a note that is not there. */
    it('does not tell the learner to read one', () => {
      show({}, { misses: 5, status: 'wrong' });
      expect(screen.getByText('Not quite. Try again.')).toBeInTheDocument();
      expect(screen.queryByText(/read the note/i)).not.toBeInTheDocument();
    });
  });

  describe('a question that has a note', () => {
    const withNote: Question = { ...QUESTION, note: 'に marks the destination.' };
    const showNoted = (over: Partial<Exercise> = {}, misses = 0, status: 'idle' | 'wrong' = 'idle') =>
      render(
        <ExerciseScreen
          exercise={exercise({ question: withNote, ...over })}
          question={withNote}
          language={LANGUAGE}
          index={0}
          misses={misses}
          placed={[]}
          status={status}
          instruction="Choose the right particle"
        />,
      );

    it('shows it once the view model says the ladder has reached it', () => {
      showNoted({ showNote: true });
      expect(screen.getByText('に marks the destination.')).toBeInTheDocument();
    });

    it('points the learner at it after enough misses', () => {
      showNoted({}, 5, 'wrong');
      expect(screen.getByText('Not yet — read the note')).toBeInTheDocument();
    });
  });

  /* A conjugation question asks for a form of a verb with no sentence around
     it, so the cloze line has nothing to draw. */
  it('omits the sentence line for a question with no frame', () => {
    const bare: Question = { ...QUESTION };
    delete (bare as { frame?: unknown }).frame;
    render(
      <ExerciseScreen
        exercise={exercise({ question: bare })}
        question={bare}
        language={LANGUAGE}
        index={0}
        misses={0}
        placed={[]}
        status="idle"
        instruction="Build the form"
      />,
    );
    expect(document.querySelectorAll('[data-blank]')).toHaveLength(0);
    expect(screen.getByRole('heading')).toHaveTextContent('One bread, please.');
  });
});
