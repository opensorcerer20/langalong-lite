/* DrillScreen is composition only, so these check that it wires the view model
   through to the right pieces — not the drill rules, which live in appReducer
   and are tested there. */

import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DrillScreen } from '../../src/components/DrillScreen';
import type {
  DrillPack,
  Tile,
} from '../../src/data/drill';
import type { AppState } from '../../src/state/appReducer';
import { initialState } from '../../src/state/appReducer';
import type { Tsumiki } from '../../src/state/useTsumiki';
import {
  drillItem,
  drillScenario,
  tile,
} from '../helpers/fixtures';

const BANK: readonly Tile[] = [
  tile('ください', 'kudasai', 'verb'),
  tile('は', 'wa', 'particle'),
  tile('パン', 'pan'),
  tile('を', 'o', 'particle'),
];

const ITEM = drillItem({
  promptText: 'One bread, please.',
  answer: [tile('パン', 'pan'), tile('を', 'o', 'particle'), tile('ください', 'kudasai', 'verb')],
  note: 'を marks the direct object.',
});

const SCENARIO = drillScenario({
  id: 'bakery',
  name: 'Bakery',
  blurb: 'At the counter.',
  items: [ITEM],
});

/* A stand-in pack rather than the real one: this screen only reads the name and
   the joiner, and building them here keeps the test off the shipped content. */
const LANGUAGE: DrillPack = {
  code: 'ja',
  name: 'Japanese',
  joiner: '',
  fontStack: "'Noto Sans JP'",
  grammar: [],
  scenarios: [SCENARIO],
};

/** A stand-in view model, so the screen can be driven directly. */
function view(state: Partial<AppState> = {}, over: Partial<Tsumiki> = {}): Tsumiki {
  const merged: AppState = { ...initialState, screen: 'drill', ...state };
  const done = merged.status === 'right' || merged.status === 'shown';

  return {
    state: merged,
    language: LANGUAGE,
    scenarios: [SCENARIO],
    scenario: SCENARIO,
    item: ITEM,
    bank: BANK,
    total: 10,
    done,
    isLastItem: false,
    showNote: merged.misses >= 2 || done,
    showReveal: merged.misses >= 3 && !done,
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

  it('checks the answer', async () => {
    const tsumiki = view({ placed: [2] });
    render(<DrillScreen tsumiki={tsumiki} />);
    await userEvent.click(screen.getByRole('button', { name: 'Check' }));
    expect(tsumiki.check).toHaveBeenCalledOnce();
  });

  it('holds the note back until it is due', () => {
    render(<DrillScreen tsumiki={view({ misses: 1, status: 'wrong' })} />);
    expect(screen.queryByText(ITEM.note)).not.toBeInTheDocument();
  });

  it('shows the note once it is due', () => {
    render(<DrillScreen tsumiki={view({ misses: 2, status: 'wrong' })} />);
    expect(screen.getByText(ITEM.note)).toBeInTheDocument();
    expect(screen.getByText('Grammar')).toBeInTheDocument();
  });

  it('relabels the note once the answer is settled', () => {
    render(<DrillScreen tsumiki={view({ status: 'right', placed: [2, 3, 0] })} />);
    expect(screen.getByText('Additional grammar tips')).toBeInTheDocument();
  });

  it('locks the bank once the answer is settled', async () => {
    const tsumiki = view({ status: 'right', placed: [2, 3, 0] });
    render(<DrillScreen tsumiki={tsumiki} />);
    await userEvent.click(screen.getAllByText('は')[0]!);
    expect(tsumiki.tap).not.toHaveBeenCalled();
  });

  it('offers the reveal only once enough misses have happened', async () => {
    const tsumiki = view({ misses: 3, status: 'wrong' });
    render(<DrillScreen tsumiki={tsumiki} />);
    await userEvent.click(screen.getByRole('button', { name: /show me the answer/i }));
    expect(tsumiki.reveal).toHaveBeenCalledOnce();
  });

  it('advances once the answer is settled', async () => {
    const tsumiki = view({ status: 'shown', placed: [2, 3, 0] });
    render(<DrillScreen tsumiki={tsumiki} />);
    await userEvent.click(screen.getByRole('button', { name: /next sentence/i }));
    expect(tsumiki.next).toHaveBeenCalledOnce();
  });
});
