/* The one authoring mistake the compiler cannot see: a typo'd *optional* key.
   `"nte"` for `"note"` leaves `note` absent, which is legal, so the sentence
   quietly loses its explanation.

   The allowed keys are listed here, not in src/. A field added to PackFile but
   not here fails the first time content uses it, which is the safe direction. */

import { describe, expect, it } from 'vitest';

import type { PackFile } from '../../src/data/loadPack';

const PACK_KEYS = [
  'code',
  'name',
  'joiner',
  'fontStack',
  'lexicon',
  'grammar',
  'particles',
  'conjugations',
  'scenarios',
];
const SCENARIO_KEYS = ['id', 'name', 'blurb', 'words', 'items'];
const ITEM_KEYS = ['id', 'en', 'ans', 'alts', 'note', 'teaches'];
const PARTICLE_KEYS = ['tile', 'gloss'];
const CONJUGATION_KEYS = ['name', 'note'];

/** Keys of `object` that `allowed` does not list, each as a ready message. */
function strayKeys(object: object, allowed: readonly string[], where: string): string[] {
  return Object.keys(object)
    .filter((key) => !allowed.includes(key))
    .map((key) => `${where} has unknown key "${key}" — expected one of: ${allowed.join(', ')}`);
}

/**
 * Every key in `pack` that no authored shape declares. Walks the five levels by
 * hand: a generic walker would need the shapes as data, i.e. a schema library.
 */
export function unknownKeys(pack: PackFile): string[] {
  const problems = strayKeys(pack, PACK_KEYS, 'the pack');

  for (const [id, particle] of Object.entries(pack.particles)) {
    problems.push(...strayKeys(particle, PARTICLE_KEYS, `particle "${id}"`));
  }
  for (const [id, pattern] of Object.entries(pack.conjugations)) {
    problems.push(...strayKeys(pattern, CONJUGATION_KEYS, `conjugation "${id}"`));
  }
  for (const scenario of pack.scenarios) {
    problems.push(...strayKeys(scenario, SCENARIO_KEYS, `situation "${scenario.id}"`));
    for (const item of scenario.items) {
      problems.push(...strayKeys(item, ITEM_KEYS, `${scenario.id} ${item.id}`));
    }
  }

  return problems;
}

/** A minimal well-formed pack, for a test to spoil one field of. */
function pack(): PackFile {
  return {
    code: 'xx',
    name: 'Test',
    joiner: '',
    fontStack: 'serif',
    lexicon: { パン: 'pan', を: 'o' },
    grammar: ['を'],
    particles: { o: { tile: 'を', gloss: 'direct object' } },
    conjugations: { tai: { name: 'want to', note: 'stem + たい' } },
    scenarios: [
      {
        id: 'bakery',
        name: 'Bakery',
        blurb: 'At the counter.',
        items: [{ id: '01', en: 'Bread.', ans: 'パン|を' }],
      },
    ],
  };
}

/** Add a key the shapes do not declare, past the type that forbids it. */
function withStrayKey<T extends object>(on: T, key: string, value: unknown): T {
  return { ...on, [key]: value };
}

describe('unknownKeys', () => {
  it('passes a pack that uses only declared keys', () => {
    expect(unknownKeys(pack())).toEqual([]);
  });

  it('accepts every optional key spelled correctly', () => {
    const full = pack();
    const scenario = full.scenarios[0]!;

    expect(
      unknownKeys({
        ...full,
        scenarios: [
          {
            ...scenario,
            words: ['パン'],
            items: [{ ...scenario.items[0]!, alts: ['パンを'], note: '…', teaches: ['o'] }],
          },
        ],
      }),
    ).toEqual([]);
  });

  /* The case this file exists for. */
  it('catches a typo in an optional key on a sentence', () => {
    const full = pack();
    const scenario = full.scenarios[0]!;
    const problems = unknownKeys({
      ...full,
      scenarios: [
        { ...scenario, items: [withStrayKey(scenario.items[0]!, 'nte', 'was meant to be note')] },
      ],
    });

    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('bakery 01');
    expect(problems[0]).toContain('"nte"');
    /* The message lists what was allowed, so the fix is on screen. */
    expect(problems[0]).toContain('note');
  });

  it.each([
    ['the pack itself', (p: PackFile) => withStrayKey(p, 'fontStuck', 'serif'), 'the pack'],
    [
      'a situation',
      (p: PackFile) => ({ ...p, scenarios: [withStrayKey(p.scenarios[0]!, 'kicker', 'Set 01')] }),
      'situation "bakery"',
    ],
    [
      'a particle',
      (p: PackFile) => ({
        ...p,
        particles: { o: withStrayKey(p.particles.o!, 'confusedWith', []) },
      }),
      'particle "o"',
    ],
    [
      'a conjugation pattern',
      (p: PackFile) => ({
        ...p,
        conjugations: { tai: withStrayKey(p.conjugations.tai!, 'verbGroups', []) },
      }),
      'conjugation "tai"',
    ],
  ])('catches a stray key on %s', (_case, spoil, where) => {
    const problems = unknownKeys(spoil(pack()));
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(where);
  });

  it('reports every stray key rather than stopping at the first', () => {
    const full = pack();
    const scenario = full.scenarios[0]!;
    const problems = unknownKeys(
      withStrayKey(
        {
          ...full,
          scenarios: [
            { ...scenario, items: [withStrayKey(scenario.items[0]!, 'alt', ['パンを'])] },
          ],
        },
        'lexicom',
        {},
      ),
    );

    expect(problems).toHaveLength(2);
  });
});
