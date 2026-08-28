/* End-to-end through the real content and the real reducer — the test that
   would catch the conversion having quietly changed how a drill behaves. */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/components/App';
import { TILE_MULTIPLIER, VOCAB_CHOICES, VOCAB_SET_SIZE } from '../../src/config';
import { LANGUAGE } from '../../src/data/languages';
import { buildBank } from '../../src/lib/buildBank';
import { vocabQuestions } from '../../src/lib/questions/vocab';
import { revealIndices } from '../../src/lib/revealPlacement';

const BAKERY = LANGUAGE.scenarios[0]!;

const bankFor = (index: number) =>
  buildBank(
    BAKERY.items[index]!,
    index,
    { grammar: LANGUAGE.grammar, words: BAKERY.words },
    TILE_MULTIPLIER,
    LANGUAGE.joiner,
  );

/** The tile bank as rendered — the hidden used tiles included. */
const bankTiles = () => {
  const bank = document.querySelectorAll('[data-variant="bank"]');
  return Array.from(bank) as HTMLElement[];
};

/** Tap the tiles that spell item `index`'s canonical answer, in order. */
async function solve(user: ReturnType<typeof userEvent.setup>, index: number) {
  const item = BAKERY.items[index]!;
  for (const position of revealIndices(item.ans, bankFor(index))) {
    await user.click(bankTiles()[position]!);
  }
}

const primary = () => screen.getByRole('button', { name: /check|next sentence|finish set/i });

describe('App', () => {
  it('opens on the home screen', () => {
    render(<App language={LANGUAGE} />);
    expect(screen.getByText('Choose a situation')).toBeInTheDocument();
    expect(screen.getByText('TSUMIKI')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /all/i })).not.toBeInTheDocument();
  });

  it('opens a situation at its first sentence', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    expect(screen.getByRole('heading')).toHaveTextContent(BAKERY.items[0]!.en);
    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
    expect(screen.getByText('Bakery · 01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
  });

  /* The full miss ladder on one item: silent retry, then the note, then the
     reveal offered. */
  it('walks the miss ladder from a silent retry to the offered reveal', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    const note = BAKERY.items[0]!.note;
    const wrongTile = () =>
      bankTiles().find((tile) => !tile.hasAttribute('data-used'))!;

    /* First miss — a nudge, no explanation. */
    await user.click(wrongTile());
    await user.click(primary());
    expect(screen.getByRole('status')).toHaveTextContent('Not quite. Try again.');
    expect(screen.queryByText(note)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show me/i })).not.toBeInTheDocument();

    /* Second miss — the note appears. */
    await user.click(wrongTile());
    await user.click(primary());
    expect(screen.getByText(note)).toBeInTheDocument();
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Not yet — read the note');

    /* Third miss — the reveal is offered. */
    await user.click(wrongTile());
    await user.click(primary());
    const reveal = screen.getByRole('button', { name: /show me the answer/i });

    await user.click(reveal);
    expect(screen.getByRole('status')).toHaveTextContent('Answer shown');
    expect(screen.getByText('Additional grammar tips')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show me/i })).not.toBeInTheDocument();

    /* That a reveal forfeits the first-try credit is appReducer's rule, and is
       asserted there — playing out the remaining nine sentences here to read it
       off the done screen costs a second and proves nothing extra. */
  });

  it('accepts a correct answer and counts it', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    await solve(user, 0);
    await user.click(primary());

    expect(screen.getByRole('status')).toHaveTextContent('Correct');
    expect(screen.getByText('Additional grammar tips')).toBeInTheDocument();
    expect(primary()).toHaveTextContent('Next sentence');
  });

  it('clears the answer line on a wrong answer', async () => {
    const user = userEvent.setup();
    const { container } = render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    await user.click(bankTiles()[0]!);
    await user.click(bankTiles()[1]!);
    await user.click(primary());

    const placed = container.querySelectorAll('[data-variant="placed"]');
    expect(placed).toHaveLength(0);
  });

  it('sends a placed tile back to the bank when tapped', async () => {
    const user = userEvent.setup();
    const { container } = render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    await user.click(bankTiles()[0]!);
    const placed = container.querySelector('[data-variant="placed"]')!;
    expect(bankTiles()[0]).toHaveAttribute('data-used');

    await user.click(placed);
    expect(container.querySelectorAll('[data-variant="placed"]')).toHaveLength(0);
    expect(bankTiles()[0]).not.toHaveAttribute('data-used');
  });

  it('advances to the next sentence with a clean line', async () => {
    const user = userEvent.setup();
    const { container } = render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    await solve(user, 0);
    await user.click(primary());
    await user.click(primary());

    expect(screen.getByRole('heading')).toHaveTextContent(BAKERY.items[1]!.en);
    expect(screen.getByText(/item 2 of 10/)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-variant="placed"]')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  /* A whole set, start to finish, then round again — one journey rather than
     three that each replay the same ten sentences to make one assertion. The
     replay is the expensive thing in this file, so it happens once. */
  it('finishes the set, scores it, and practises it again from the top', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    for (let index = 0; index < BAKERY.items.length; index++) {
      await solve(user, index);
      await user.click(primary()); /* check */
      await user.click(primary()); /* next / finish */
    }

    expect(screen.getByText('Set complete')).toBeInTheDocument();
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(screen.getByText('built first try')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');

    await user.click(screen.getByRole('button', { name: /practise this set again/i }));

    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(BAKERY.items[0]!.en);
  });

  it('goes back to the situations and into the other set', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));
    await user.click(screen.getByRole('button', { name: /all/i }));

    expect(screen.getByText('Choose a situation')).toBeInTheDocument();

    await user.click(screen.getByText('Train station'));
    expect(screen.getByText('Train station · 02')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(LANGUAGE.scenarios[1]!.items[0]!.en);
    expect(screen.getByText(/item 1 of 8/)).toBeInTheDocument();
  });

  it('restarts a set that is reopened rather than resuming it', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    await solve(user, 0);
    await user.click(primary());
    await user.click(primary());
    expect(screen.getByText(/item 2 of 10/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /all/i }));
    await user.click(screen.getByText('Bakery'));
    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
  });

  it('oversupplies the bank, so the answer cannot be found by elimination', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    const needed = BAKERY.items[0]!.ans.length;
    expect(bankTiles().length).toBeGreaterThan(needed * 2);
  });

  it('renders the romaji under the kana', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText('Bakery'));

    const tile = bankTiles()[0]!;
    const [kana] = bankFor(0)[0]!;
    expect(within(tile).getByText(kana)).toBeInTheDocument();
    expect(tile.textContent).not.toBe(kana);
  });
});

/* The vocabulary exercise, played through the real app.

   The sentence drill above is unchanged by Phase 1 and its tests prove it. This
   is the other half: that the same reducer, the same miss ladder and the same
   done screen drive an exercise that is not a sentence. */
describe('App — the vocabulary exercise', () => {
  const VOCAB = vocabQuestions(LANGUAGE, BAKERY, VOCAB_SET_SIZE, VOCAB_CHOICES);

  /** Open Bakery's vocabulary set from the home screen, as a learner would. */
  async function openVocab(user: ReturnType<typeof userEvent.setup>) {
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByRole('button', { name: 'Vocabulary — Bakery' }));
  }

  /** Tap the right option for question `index`, then check. */
  async function answer(user: ReturnType<typeof userEvent.setup>, index: number) {
    const question = VOCAB[index]!;
    const wanted = question.answer[0]![0];
    const position = question.choices.findIndex((tile) => tile[0] === wanted);
    await user.click(bankTiles()[position]!);
    await user.click(primary());
  }

  it('is reachable from the home screen without touching the sentence drill', async () => {
    const user = userEvent.setup();
    await openVocab(user);

    expect(screen.getByText('Bakery · Vocabulary')).toBeInTheDocument();
    expect(screen.getByText(/Choose the missing word — item 1 of 6/)).toBeInTheDocument();
  });

  it('shows the sentence with a gap where the word belongs', async () => {
    const user = userEvent.setup();
    await openVocab(user);

    expect(screen.getByRole('heading')).toHaveTextContent('One bread, please.');
    expect(document.querySelectorAll('[data-blank]')).toHaveLength(1);
    expect(bankTiles()).toHaveLength(VOCAB_CHOICES);
  });

  it('accepts the right word and moves on', async () => {
    const user = userEvent.setup();
    await openVocab(user);
    await answer(user, 0);

    expect(screen.getByText('Correct')).toBeInTheDocument();
    await user.click(primary());
    expect(screen.getByText(/item 2 of 6/)).toBeInTheDocument();
  });

  it('walks the same miss ladder as the sentence drill, minus the note', async () => {
    const user = userEvent.setup();
    await openVocab(user);

    const wrong = VOCAB[0]!.choices.findIndex((tile) => tile[0] !== VOCAB[0]!.answer[0]![0]);
    await user.click(bankTiles()[wrong]!);
    await user.click(primary());

    expect(screen.getByText('Not quite. Try again.')).toBeInTheDocument();
    /* Vocabulary carries no note, so the ladder never points at one. */
    expect(screen.queryByText('Grammar')).not.toBeInTheDocument();
  });

  it('finishes the set and scores it', async () => {
    const user = userEvent.setup();
    await openVocab(user);

    for (let index = 0; index < VOCAB.length; index++) {
      await answer(user, index);
      await user.click(primary());
    }

    expect(screen.getByText('Vocabulary complete')).toBeInTheDocument();
    expect(screen.getByText(`${VOCAB.length} / ${VOCAB.length}`)).toBeInTheDocument();
    expect(screen.getByText('recalled first try')).toBeInTheDocument();
  });

  it('goes back to the situations, which still open their sentence drill', async () => {
    const user = userEvent.setup();
    await openVocab(user);
    await user.click(screen.getByRole('button', { name: /all/i }));

    await user.click(screen.getByRole('button', { name: 'Bakery — build sentences' }));
    expect(screen.getByText('Bakery · 01')).toBeInTheDocument();
    expect(screen.getByText(/Say this in Japanese/)).toBeInTheDocument();
  });
});
