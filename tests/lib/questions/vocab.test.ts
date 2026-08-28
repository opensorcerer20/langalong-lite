/* Compiling a situation into vocabulary questions.

   Two halves: the shape of one question, checked against a stand-in pack, and
   the properties that must hold over the content the app actually ships — every
   question answerable, every option plausible, nothing offered that is already
   on screen. */

import { describe, expect, it } from 'vitest';

import { VOCAB_CHOICES, VOCAB_SET_SIZE } from '../../../src/config';
import { LANGUAGE } from '../../../src/data/languages';
import type { LanguagePack, Scenario } from '../../../src/data/types';
import { tileKey } from '../../../src/lib/keys';
import { vocabQuestions } from '../../../src/lib/questions/vocab';

const BAKERY = LANGUAGE.scenarios[0]!;

const compile = (scenario: Scenario, size = VOCAB_SET_SIZE, choices = VOCAB_CHOICES) =>
  vocabQuestions(LANGUAGE, scenario, size, choices);

describe('vocabQuestions', () => {
  it('compiles one question per sentence, up to the set size', () => {
    expect(compile(BAKERY)).toHaveLength(VOCAB_SET_SIZE);
    expect(compile(BAKERY, 3)).toHaveLength(3);
  });

  it('asks with the English prompt and answers with a word from the sentence', () => {
    const [first] = compile(BAKERY);
    expect(first?.prompt).toBe(BAKERY.items[0]?.en);
    expect(first?.answer.map((tile) => tile[0])).toEqual(['パン']);
  });

  it('keys each question on the tile being reviewed', () => {
    const [first] = compile(BAKERY);
    expect(first?.key).toBe(tileKey('ja', ['パン', 'pan']));
    expect(first?.unit).toBe('tile');
    expect(first?.mode).toBe('vocab');
    expect(first?.scenarioId).toBe('bakery');
  });

  /* The answer is lifted out of the sentence, not appended to it: the learner
     reads the sentence they already know with one word missing. */
  it('blanks the answer out of the sentence it came from', () => {
    const [first] = compile(BAKERY);
    const frame = first?.frame?.map((tile) => (tile === null ? '___' : tile[0])).join('');
    expect(frame).toBe('___をください');
  });

  /* No note, deliberately. A sentence's note explains its grammar — を marking
     the direct object — which is not what a blanked-out word is testing. */
  it('carries no note, because the sentence note is about something else', () => {
    for (const question of compile(BAKERY)) {
      expect(question.note, `${question.key} has a note`).toBeUndefined();
    }
  });

  it('offers the configured number of options, one of them right', () => {
    for (const question of compile(BAKERY)) {
      expect(question.choices).toHaveLength(VOCAB_CHOICES);
      const answer = question.answer[0]?.[0];
      expect(question.choices.map((tile) => tile[0]), question.key).toContain(answer);
    }
  });

  describe('over every situation the app ships', () => {
    const everyQuestion = LANGUAGE.scenarios.flatMap((scenario) =>
      compile(scenario).map((question) => ({ scenario, question })),
    );

    it('produces a full set for each one', () => {
      for (const scenario of LANGUAGE.scenarios) {
        expect(compile(scenario).length, scenario.name).toBe(VOCAB_SET_SIZE);
      }
    });

    it('always leaves the answer buildable from the options', () => {
      for (const { question } of everyQuestion) {
        const offered = question.choices.map((tile) => tile[0]);
        for (const [text] of question.answer) {
          expect(offered, `${question.key} cannot be answered`).toContain(text);
        }
      }
    });

    /* Wrong options come from the scene, not the grammar pool: a question
       asking which word means "bread" is not a question if the alternatives
       are particles. */
    it('draws wrong options from the situation’s own vocabulary', () => {
      const grammar = new Set(LANGUAGE.grammar.map((tile) => tile[0]));
      for (const { scenario, question } of everyQuestion) {
        const words = new Set(scenario.words.map((tile) => tile[0]));
        const answer = question.answer[0]?.[0];
        for (const [text] of question.choices) {
          if (text === answer) continue;
          expect(grammar.has(text), `${question.key} offers the particle ${text}`).toBe(false);
          expect(words.has(text), `${question.key} offers ${text}, not a ${scenario.name} word`)
            .toBe(true);
        }
      }
    });

    /* Offering ください as a wrong answer while it sits two words away in the
       frame is a puzzle about reading, not about vocabulary. */
    it('never offers a word already visible in the sentence', () => {
      for (const { question } of everyQuestion) {
        const onScreen = new Set(
          (question.frame ?? []).filter((tile) => tile !== null).map((tile) => tile[0]),
        );
        for (const [text] of question.choices) {
          expect(onScreen.has(text), `${question.key} offers ${text}, already on screen`).toBe(
            false,
          );
        }
      }
    });

    it('leaves exactly one blank to fill', () => {
      for (const { question } of everyQuestion) {
        const blanks = (question.frame ?? []).filter((tile) => tile === null);
        expect(blanks.length, question.key).toBe(question.answer.length);
      }
    });
  });

  describe('when a situation cannot fill a set', () => {
    /* A sentence built entirely from the grammar pool has no word to be about.
       Skipping it beats a question with a blank where its answer should be. */
    it('skips a sentence with no vocabulary in it', () => {
      const allGrammar: Scenario = {
        ...BAKERY,
        items: [
          {
            id: 'x1',
            en: 'Is it?',
            ans: [['は', 'wa'], ['です', 'desu'], ['か', 'ka']],
            note: 'All function words.',
            tags: { particles: [], conjugations: [] },
          },
          BAKERY.items[0]!,
        ],
      };
      const questions = compile(allGrammar);
      expect(questions).toHaveLength(1);
      expect(questions[0]?.key).toBe(tileKey('ja', ['パン', 'pan']));
    });

    it('returns a short set rather than a padded one', () => {
      const thin: Scenario = { ...BAKERY, items: BAKERY.items.slice(0, 2) };
      expect(compile(thin)).toHaveLength(2);
    });
  });

  /* Nothing in lib/ imports content, so a second pack compiles through the same
     function with no change here. */
  it('reads the pack it is given rather than the shipped one', () => {
    const pack: LanguagePack = { ...LANGUAGE, code: 'xx' };
    const [first] = vocabQuestions(pack, BAKERY, 1, 3);
    expect(first?.key.startsWith('xx:')).toBe(true);
  });
});
