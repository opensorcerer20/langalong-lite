/* End-to-end through the real content and the real reducer — the test that
   would catch the conversion having quietly changed how a drill behaves. */

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { App } from '../../src/components/App';
import { TILE_MULTIPLIER } from '../../src/config';
import { LANGUAGE } from '../../src/data/languages';
import { buildBank } from '../../src/lib/buildBank';
import { revealIndices } from '../../src/lib/revealPlacement';

/* Real content on purpose: these play whole drills end to end, which is the
   point of the file. Only the situation's *name* is derived rather than
   written out, so renaming or reordering situations does not fail them. */
const FIRST = LANGUAGE.scenarios[0]!;
const SECOND = LANGUAGE.scenarios[1]!;

const bankFor = (index: number) =>
  buildBank(
    FIRST.items[index]!,
    index,
    { grammar: LANGUAGE.grammar, words: FIRST.words },
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
  const item = FIRST.items[index]!;
  for (const position of revealIndices(item, bankFor(index))) {
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
    await user.click(screen.getByText(FIRST.name));

    expect(screen.getByRole('heading')).toHaveTextContent(FIRST.items[0]!.en);
    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
    expect(screen.getByText(`${FIRST.name} · 01`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /all/i })).toBeInTheDocument();
  });

  /* The full miss ladder on one item: silent retry, then the note, then the
     reveal offered. */
  it('walks the miss ladder from a silent retry to the offered reveal', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText(FIRST.name));

    /* This sentence teaches を and has a note; the ladder is what it is for. */
    const note = FIRST.items[0]!.note!;
    const wrongTile = () => bankTiles().find((tile) => !tile.hasAttribute('data-used'))!;

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
    await user.click(screen.getByText(FIRST.name));

    await solve(user, 0);
    await user.click(primary());

    expect(screen.getByRole('status')).toHaveTextContent('Correct');
    expect(screen.getByText('Additional grammar tips')).toBeInTheDocument();
    expect(primary()).toHaveTextContent('Next sentence');
  });

  it('clears the answer line on a wrong answer', async () => {
    const user = userEvent.setup();
    const { container } = render(<App language={LANGUAGE} />);
    await user.click(screen.getByText(FIRST.name));

    await user.click(bankTiles()[0]!);
    await user.click(bankTiles()[1]!);
    await user.click(primary());

    const placed = container.querySelectorAll('[data-variant="placed"]');
    expect(placed).toHaveLength(0);
  });

  it('sends a placed tile back to the bank when tapped', async () => {
    const user = userEvent.setup();
    const { container } = render(<App language={LANGUAGE} />);
    await user.click(screen.getByText(FIRST.name));

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
    await user.click(screen.getByText(FIRST.name));

    await solve(user, 0);
    await user.click(primary());
    await user.click(primary());

    expect(screen.getByRole('heading')).toHaveTextContent(FIRST.items[1]!.en);
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
    await user.click(screen.getByText(FIRST.name));

    for (let index = 0; index < FIRST.items.length; index++) {
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
    expect(screen.getByRole('heading')).toHaveTextContent(FIRST.items[0]!.en);
  });

  it('goes back to the situations and into the other set', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText(FIRST.name));
    await user.click(screen.getByRole('button', { name: /all/i }));

    expect(screen.getByText('Choose a situation')).toBeInTheDocument();

    await user.click(screen.getByText(SECOND.name));
    expect(screen.getByText(`${SECOND.name} · 02`)).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(SECOND.items[0]!.en);
    expect(screen.getByText(new RegExp(`item 1 of ${SECOND.items.length}`))).toBeInTheDocument();
  });

  it('restarts a set that is reopened rather than resuming it', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText(FIRST.name));

    await solve(user, 0);
    await user.click(primary());
    await user.click(primary());
    expect(screen.getByText(/item 2 of 10/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /all/i }));
    await user.click(screen.getByText(FIRST.name));
    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
  });

  it('oversupplies the bank, so the answer cannot be found by elimination', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText(FIRST.name));

    const needed = FIRST.items[0]!.ans.length;
    expect(bankTiles().length).toBeGreaterThan(needed * 2);
  });

  it('renders the romaji under the kana', async () => {
    const user = userEvent.setup();
    render(<App language={LANGUAGE} />);
    await user.click(screen.getByText(FIRST.name));

    const tile = bankTiles()[0]!;
    const [kana] = bankFor(0)[0]!;
    expect(within(tile).getByText(kana)).toBeInTheDocument();
    expect(tile.textContent).not.toBe(kana);
  });
});
