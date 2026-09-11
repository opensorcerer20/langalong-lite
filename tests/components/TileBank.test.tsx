import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TileBank } from '../../src/components/TileBank';
import type { Tile } from '../../src/data/types';

const BANK: readonly Tile[] = [
  ['ください', 'kudasai'],
  ['は', 'wa'],
  ['パン', 'pan'],
  ['を', 'o'],
];

const bank = (placed: number[], props: Partial<Parameters<typeof TileBank>[0]> = {}) =>
  render(<TileBank bank={BANK} placed={placed} onPlace={() => {}} {...props} />);

describe('TileBank', () => {
  it('shows every tile in the bank, in bank order', () => {
    bank([]);
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'くださいkudasai',
      'はwa',
      'パンpan',
      'をo',
    ]);
  });

  it('places a tile by its bank index', async () => {
    const onPlace = vi.fn();
    bank([], { onPlace });
    await userEvent.click(screen.getByText('パン'));
    expect(onPlace).toHaveBeenCalledWith(2);
  });

  /* Placed tiles are hidden but keep their space, so the bank never reflows
     under the learner's finger mid-sentence. */
  it('marks a placed tile as used without removing it from the layout', () => {
    const { container } = bank([2]);
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(4);
    expect(buttons[2]).toHaveAttribute('data-used');
    expect(buttons[0]).not.toHaveAttribute('data-used');
  });

  it('marks every placed tile, not just the first', () => {
    const { container } = bank([0, 3]);
    const used = container.querySelectorAll('button[data-used]');
    expect(used).toHaveLength(2);
  });

  it('stops responding once the answer is locked', async () => {
    const onPlace = vi.fn();
    bank([], { onPlace, locked: true });
    await userEvent.click(screen.getByText('パン'));
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('passes the romaji setting through to its tiles', () => {
    const { container } = bank([], { showReading: false });
    expect(container.textContent).toContain('パン');
    expect(container.textContent).not.toContain('pan');
  });
});
