/* DrillScreen is composition only, so these check that it wires the view model
   through to the right pieces — not the drill rules, which live in appReducer
   and are tested there. */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DrillScreen } from '../../src/components/DrillScreen';
import type { LanguagePack, SentenceItem, Tile } from '../../src/data/types';
import { initialState } from '../../src/state/appReducer';
import type { AppState } from '../../src/state/appReducer';
import type { Tsumiki } from '../../src/state/useTsumiki';

const BANK: readonly Tile[] = [
  ['ください', 'kudasai'],
  ['は', 'wa'],
  ['パン', 'pan'],
  ['を', 'o'],
];

const ITEM: SentenceItem = {
  id: '01',
  en: 'One bread, please.',
  ans: [['パン', 'pan'], ['を', 'o'], ['ください', 'kudasai']],
  note: 'を marks the direct object.',
  tags: { particles: [], conjugations: [] },
};

const SCENARIO = {
  id: 'bakery',
  name: 'Bakery',
  kicker: 'Set 01',
  blurb: 'At the counter.',
  items: [ITEM],
  words: [],
};

/* A stand-in pack rather than the real one: this screen only reads the name and
   the joiner, and building them here keeps the test off the shipped content. */
const LANGUAGE: LanguagePack = {
  code: 'ja',
  name: 'Japanese',
  joiner: '',
  fontStack: "'Noto Sans JP'",
  grammar: [],
  particles: [],
  conjugations: [],
  scenarios: [SCENARIO],
};

/** A stand-in view model, so the screen can be driven directly.

    Nothing here is derived. An earlier version computed `done`, `showNote` and
    `showReveal` from the state the test passed in, which meant a test setting
    `misses: 2` and asserting the note appeared was really asserting that this
    function could compare two numbers — the screen would have passed it however
    it was wired. The flags are plain defaults now, and a test that cares about
    one sets it explicitly. Where those flags come from is useTsumiki's business
    and is tested there. */
function view(state: Partial<AppState> = {}, over: Partial<Tsumiki> = {}): Tsumiki {
  return {
    state: { ...initialState, screen: 'drill', ...state },
    language: LANGUAGE,
    scenarios: [SCENARIO],
    scenario: SCENARIO,
    item: ITEM,
    bank: BANK,
    total: 10,
    done: false,
    isLastItem: false,
    showNote: false,
    showReveal: false,
    progress: 0,
    openScenario: vi.fn(),
    goHome: vi.fn(),
    tap: vi.fn(),
    untap: vi.fn(),
    check: vi.fn(),
    reveal: vi.fn(),
    next: vi.fn(),
    restart: vi.fn(),
    ...over,
  };
}

describe('DrillScreen', () => {
  it('shows the prompt, the answer line and the bank', () => {
    render(<DrillScreen tsumiki={view()} />);
    expect(screen.getByRole('heading')).toHaveTextContent('One bread, please.');
    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
    expect(screen.getByText('ください')).toBeInTheDocument();
  });

  it('places a tile from the bank', async () => {
    const tsumiki = view();
    render(<DrillScreen tsumiki={tsumiki} />);
    await userEvent.click(screen.getByText('パン'));
    expect(tsumiki.tap).toHaveBeenCalledWith(2);
  });

  it('returns a placed tile by its position on the line', async () => {
    const tsumiki = view({ placed: [2, 3] });
    render(<DrillScreen tsumiki={tsumiki} />);
    /* Two of each now — the placed one and its hidden slot in the bank. */
    const placed = screen.getAllByText('を')[0];
    await userEvent.click(placed!);
    expect(tsumiki.untap).toHaveBeenCalledWith(1);
  });

  /* The screen's own derivation, rather than a flag handed to it: there is
     something to check exactly when something is on the line. */
  it('can only check once a tile is placed', () => {
    const { unmount } = render(<DrillScreen tsumiki={view()} />);
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    unmount();

    render(<DrillScreen tsumiki={view({ placed: [2] })} />);
    expect(screen.getByRole('button', { name: 'Check' })).toBeEnabled();
  });

  it('shows the note only when the view model says it is due', () => {
    const { unmount } = render(<DrillScreen tsumiki={view({ misses: 1 })} />);
    expect(screen.queryByText(ITEM.note)).not.toBeInTheDocument();
    unmount();

    render(<DrillScreen tsumiki={view({ misses: 2 }, { showNote: true })} />);
    expect(screen.getByText(ITEM.note)).toBeInTheDocument();
  });

  it('locks the answer line and the bank once the answer is settled', async () => {
    const tsumiki = view({ placed: [2, 3, 0] }, { done: true });
    render(<DrillScreen tsumiki={tsumiki} />);

    await userEvent.click(screen.getAllByText('は')[0]!); /* in the bank */
    await userEvent.click(screen.getAllByText('パン')[0]!); /* on the line */
    expect(tsumiki.tap).not.toHaveBeenCalled();
    expect(tsumiki.untap).not.toHaveBeenCalled();
  });
});
