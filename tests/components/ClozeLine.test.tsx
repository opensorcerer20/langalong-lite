import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ClozeLine } from '../../src/components/ClozeLine';
import type { Tile } from '../../src/data/types';

const CHOICES: readonly Tile[] = [
  ['袋', 'fukuro'],
  ['パン', 'pan'],
  ['これ', 'kore'],
];

/** ___をください */
const FRAME: readonly (Tile | null)[] = [null, ['を', 'o'], ['ください', 'kudasai']];

const line = (props: Partial<Parameters<typeof ClozeLine>[0]> = {}) => {
  const onRemove = vi.fn();
  render(
    <ClozeLine frame={FRAME} choices={CHOICES} placed={[]} onRemove={onRemove} {...props} />,
  );
  return onRemove;
};

const blanks = () => document.querySelectorAll('[data-blank]');
const tiles = () => document.querySelectorAll('[data-variant="placed"]');

describe('ClozeLine', () => {
  it('shows the sentence around the gap', () => {
    line();
    expect(screen.getByText('を')).toBeInTheDocument();
    expect(screen.getByText('ください')).toBeInTheDocument();
  });

  it('shows a gap where the answer goes while nothing is placed', () => {
    line();
    expect(blanks()).toHaveLength(1);
    expect(tiles()).toHaveLength(0);
  });

  it('puts the chosen tile in the gap', () => {
    line({ placed: [1] });
    expect(blanks()).toHaveLength(0);
    expect(tiles()).toHaveLength(1);
    expect(screen.getByText('パン')).toBeInTheDocument();
  });

  it('sends the tile back when it is tapped, by its position on the line', async () => {
    const onRemove = line({ placed: [1] });
    await userEvent.click(screen.getByText('パン'));
    expect(onRemove).toHaveBeenCalledWith(0);
  });

  /* The surrounding words are context, not controls. Drawing them as tiles
     would invite tapping words that do nothing. */
  it('leaves the context words untappable', () => {
    line();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('locks the placed tile once the answer is settled', () => {
    line({ placed: [1], locked: true });
    expect(screen.getByRole('button')).toBeDisabled();
  });

  /* A conjugation question could blank a stem and its ending, so the nth blank
     takes the nth placed tile. */
  describe('with more than one gap', () => {
    const TWO: readonly (Tile | null)[] = [['食べ', 'tabe'], null, null];

    it('shows one gap per blank', () => {
      line({ frame: TWO });
      expect(blanks()).toHaveLength(2);
    });

    it('fills them in the order they were placed', () => {
      line({ frame: TWO, placed: [0, 2] });
      expect(blanks()).toHaveLength(0);
      expect([...tiles()].map((tile) => tile.textContent)).toEqual([
        expect.stringContaining('袋'),
        expect.stringContaining('これ'),
      ]);
    });

    it('leaves the later gap open while only the first is filled', () => {
      line({ frame: TWO, placed: [0] });
      expect(blanks()).toHaveLength(1);
      expect(tiles()).toHaveLength(1);
    });
  });
});
