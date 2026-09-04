/* What resolveLibrary does with content, and what it does with broken content.

   The failure cases matter more than the happy path here. Every one of them is
   a content mistake that has no safe fallback, so the contract is that it
   throws at load rather than handing the drill something half-built. */

import { describe, expect, it } from 'vitest';

import type { DrillLanguage } from '../../src/data/drill';
import { resolveLibrary } from '../../src/data/resolve';
import type { ContentStore, StoredExercise, StoredScenario, StoredTile } from '../../src/data/schema';

const LANGUAGE: DrillLanguage = { code: 'xx', name: 'Test', joiner: '', fontStack: 'serif' };

const tile = (id: `${StoredTile['type']}:${string}`, newLanguageText: string, reading: string): StoredTile => ({
  id,
  scenarioIds: ['one'],
  newLanguageText,
  reading,
  type: id.split(':')[0] as StoredTile['type'],
});

const SCENARIO: StoredScenario = {
  id: 'one',
  name: 'One',
  library: 'xx',
  kicker: 'Set 01',
  blurb: 'A situation.',
  vocab: ['noun:b'],
};

const EXERCISE: StoredExercise = {
  id: 'one-01',
  scenarioId: 'one',
  promptText: 'A prompt.',
  answerTileIds: ['noun:a', 'particle:x'],
  alternateAnswerTileIds: [['noun:b', 'particle:x']],
  note: 'A note.',
  tags: ['particle:x'],
};

const store = (overrides: Partial<ContentStore> = {}): ContentStore => ({
  library: 'xx',
  scenarios: [SCENARIO],
  tiles: [tile('noun:a', 'a', 'ay'), tile('noun:b', 'b', 'bee'), tile('particle:x', 'x', 'ex')],
  exercises: [EXERCISE],
  grammarTileIds: ['particle:x'],
  ...overrides,
});

describe('resolveLibrary', () => {
  it('carries the language facts through untouched', () => {
    expect(resolveLibrary(store(), LANGUAGE)).toMatchObject(LANGUAGE);
  });

  it('swaps every id for the tile it names', () => {
    const item = resolveLibrary(store(), LANGUAGE).scenarios[0]!.items[0]!;
    expect(item.answer.map((t) => t.newLanguageText)).toEqual(['a', 'x']);
    expect(item.answer.map((t) => t.reading)).toEqual(['ay', 'ex']);
    expect(item.alternates.map((alt) => alt.map((t) => t.newLanguageText))).toEqual([['b', 'x']]);
  });

  it('drops scenarioIds, which is a fact about the library and not the tile', () => {
    const [first] = resolveLibrary(store(), LANGUAGE).grammar;
    expect(first).toEqual({ id: 'particle:x', newLanguageText: 'x', reading: 'ex', type: 'particle' });
  });

  it('carries the prompt, note and tags through untouched', () => {
    const item = resolveLibrary(store(), LANGUAGE).scenarios[0]!.items[0]!;
    expect(item.promptText).toBe('A prompt.');
    expect(item.note).toBe('A note.');
    expect(item.tags).toEqual(['particle:x']);
  });

  it('gives each situation only its own exercises', () => {
    const two: StoredScenario = { ...SCENARIO, id: 'two', name: 'Two', vocab: [] };
    const resolved = resolveLibrary(
      store({
        scenarios: [SCENARIO, two],
        exercises: [EXERCISE, { ...EXERCISE, id: 'two-01', scenarioId: 'two' }],
      }),
      LANGUAGE,
    );
    expect(resolved.scenarios.map((s) => s.items.map((i) => i.id))).toEqual([['one-01'], ['two-01']]);
  });

  it('throws when an answer names a tile that is not in the library', () => {
    const broken = { ...EXERCISE, answerTileIds: ['noun:a', 'noun:missing'] as const };
    expect(() => resolveLibrary(store({ exercises: [broken] }), LANGUAGE)).toThrow(
      /Exercise "one-01" refers to tile "noun:missing"/,
    );
  });

  it('throws when an alternate names a tile that is not in the library', () => {
    const broken = { ...EXERCISE, alternateAnswerTileIds: [['noun:missing' as const]] };
    expect(() => resolveLibrary(store({ exercises: [broken] }), LANGUAGE)).toThrow(/alternate/);
  });

  it('throws when a situation offers vocabulary that is not in the library', () => {
    const broken = { ...SCENARIO, vocab: ['noun:missing' as const] };
    expect(() => resolveLibrary(store({ scenarios: [broken] }), LANGUAGE)).toThrow(
      /Scenario "one" vocabulary/,
    );
  });

  it('throws when the grammar pool names a tile that is not in the library', () => {
    expect(() => resolveLibrary(store({ grammarTileIds: ['particle:missing'] }), LANGUAGE)).toThrow(
      /grammar pool/,
    );
  });

  /* Without this the filter in resolveScenario would quietly drop the exercise,
     taking a sentence out of the app with nothing to show for it. */
  it('throws when an exercise belongs to a situation that does not exist', () => {
    const orphan = { ...EXERCISE, id: 'ghost-01', scenarioId: 'ghost' };
    expect(() => resolveLibrary(store({ exercises: [orphan] }), LANGUAGE)).toThrow(
      /Exercise "ghost-01" belongs to scenario "ghost"/,
    );
  });

  it('throws when two tiles share an id, rather than losing one of them', () => {
    const tiles = [...store().tiles, tile('noun:a', 'a', 'different')];
    expect(() => resolveLibrary(store({ tiles }), LANGUAGE)).toThrow(
      /two tiles share the id "noun:a"/,
    );
  });
});
