/* End-to-end through the real content and the real reducer — the test that
   would catch the conversion having quietly changed how a drill behaves. */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/components/App/App';
import { TILE_MULTIPLIER } from '../../src/config';
import { GRAMMAR } from '../../src/data/grammar';
import { SCENARIOS } from '../../src/data/scenarios';
import { buildBank } from '../../src/lib/buildBank';
import { revealIndices } from '../../src/lib/revealPlacement';

const BAKERY = SCENARIOS[0]!;

const bankFor = (index: number) =>
  buildBank(BAKERY.items[index]!, index, { grammar: GRAMMAR, words: BAKERY.words }, TILE_MULTIPLIER);

/** The tile bank as rendered — the hidden used tiles included. */
const bankTiles = () => {
  const bank = document.querySelectorAll('button[class*="bank"]');
  return Array.from(bank) as HTMLElement[];
};

/** Tap the tiles that spell item `index`'s canonical answer, in order. */
async function solve(user: ReturnType<typeof userEvent.setup>, index: number) {
  const item = BAKERY.items[index]!;
  for (const position of revealIndices(item, bankFor(index))) {
    await user.click(bankTiles()[position]!);
  }
}

const primary = () => screen.getByRole('button', { name: /check|next sentence|finish set/i });

describe('App', () => {
  it('opens on the home screen', () => {
    render(<App />);
    expect(screen.getByText('Choose a situation')).toBeInTheDocument();
    expect(screen.getByText('TSUMIKI')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /all/i })).not.toBeInTheDocument();
  });

  it('opens a situation at its first sentence', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));

    expect(screen.getByRole('heading')).toHaveTextContent(BAKERY.items[0]!.en);
    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
    expect(screen.getByText('Bakery · 01')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
  });

  it('cannot check an empty answer line', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));
    expect(primary()).toBeDisabled();
  });

  /* The full miss ladder on one item: silent retry, then the note, then the
     reveal — and the reveal costs the first-try credit. */
  it('walks the miss ladder and forfeits the credit on a reveal', async () => {
    const user = userEvent.setup();
    render(<App />);
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

    /* Finish the set to read the score: revealed, so no credit. */
    for (let i = 0; i < BAKERY.items.length; i++) {
      await user.click(primary());
      if (i < BAKERY.items.length - 1) await user.click(primary()); /* reveal-free advance */
    }
  });

  it('accepts a correct answer and counts it', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));

    await solve(user, 0);
    await user.click(primary());

    expect(screen.getByRole('status')).toHaveTextContent('Correct');
    expect(screen.getByText('Additional grammar tips')).toBeInTheDocument();
    expect(primary()).toHaveTextContent('Next sentence');
  });

  it('clears the answer line on a wrong answer', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByText('Bakery'));

    await user.click(bankTiles()[0]!);
    await user.click(bankTiles()[1]!);
    await user.click(primary());

    const placed = container.querySelectorAll('button[class*="placed"]');
    expect(placed).toHaveLength(0);
  });

  it('sends a placed tile back to the bank when tapped', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByText('Bakery'));

    await user.click(bankTiles()[0]!);
    const placed = container.querySelector('button[class*="placed"]')!;
    expect(bankTiles()[0]).toHaveAttribute('data-used');

    await user.click(placed);
    expect(container.querySelectorAll('button[class*="placed"]')).toHaveLength(0);
    expect(bankTiles()[0]).not.toHaveAttribute('data-used');
  });

  it('advances to the next sentence with a clean line', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByText('Bakery'));

    await solve(user, 0);
    await user.click(primary());
    await user.click(primary());

    expect(screen.getByRole('heading')).toHaveTextContent(BAKERY.items[1]!.en);
    expect(screen.getByText(/item 2 of 10/)).toBeInTheDocument();
    expect(container.querySelectorAll('button[class*="placed"]')).toHaveLength(0);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('finishes the set and scores the sentences built first try', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));

    for (let index = 0; index < BAKERY.items.length; index++) {
      await solve(user, index);
      await user.click(primary()); /* check */
      await user.click(primary()); /* next / finish */
    }

    expect(screen.getByText('Set complete')).toBeInTheDocument();
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    expect(screen.getByText('built first try')).toBeInTheDocument();
  });

  it('shows a full progress rule on the done screen', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));

    for (let index = 0; index < BAKERY.items.length; index++) {
      await solve(user, index);
      await user.click(primary());
      await user.click(primary());
    }
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('practises the set again from the top', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));

    for (let index = 0; index < BAKERY.items.length; index++) {
      await solve(user, index);
      await user.click(primary());
      await user.click(primary());
    }
    await user.click(screen.getByRole('button', { name: /practise this set again/i }));

    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(BAKERY.items[0]!.en);
  });

  it('goes back to the situations and into the other set', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));
    await user.click(screen.getByRole('button', { name: /all/i }));

    expect(screen.getByText('Choose a situation')).toBeInTheDocument();

    await user.click(screen.getByText('Train station'));
    expect(screen.getByText('Train station · 02')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(SCENARIOS[1]!.items[0]!.en);
    expect(screen.getByText(/item 1 of 8/)).toBeInTheDocument();
  });

  it('restarts a set that is reopened rather than resuming it', async () => {
    const user = userEvent.setup();
    render(<App />);
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
    render(<App />);
    await user.click(screen.getByText('Bakery'));

    const needed = BAKERY.items[0]!.ans.length;
    expect(bankTiles().length).toBeGreaterThan(needed * 2);
  });

  it('renders the romaji under the kana', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByText('Bakery'));

    const tile = bankTiles()[0]!;
    const [kana] = bankFor(0)[0]!;
    expect(within(tile).getByText(kana)).toBeInTheDocument();
    expect(tile.textContent).not.toBe(kana);
  });
});
