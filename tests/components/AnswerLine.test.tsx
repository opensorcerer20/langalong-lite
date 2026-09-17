import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AnswerLine } from '../../src/components/AnswerLine';
import type { Tile } from '../../src/data/types';

const BANK: readonly Tile[] = [
  ['ください', 'kudasai'],
  ['は', 'wa'],
  ['パン', 'pan'],
  ['を', 'o'],
];

const line = (placed: number[], props: Partial<Parameters<typeof AnswerLine>[0]> = {}) =>
  render(<AnswerLine bank={BANK} placed={placed} onRemove={() => {}} {...props} />);

describe('AnswerLine', () => {
  it('shows the placed tiles in the order they were placed', () => {
    line([2, 3, 0]);
    const tiles = screen.getAllByRole('button').map((b) => b.textContent);
    expect(tiles).toEqual(['パンpan', 'をo', 'くださいkudasai']);
  });

  it('removes a tile by its position on the line, not its bank index', async () => {
    const onRemove = vi.fn();
    line([2, 3, 0], { onRemove });
    await userEvent.click(screen.getByText('を'));
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it('stops responding once the answer is locked', async () => {
    const onRemove = vi.fn();
    line([2, 3, 0], { onRemove, locked: true });
    await userEvent.click(screen.getByText('パン'));
    expect(onRemove).not.toHaveBeenCalled();
  });

  /* The same tile can legitimately appear twice in one sentence, so the line
     must not collapse the repeat. */
  it('renders a repeated tile twice', () => {
    line([2, 2]);
    expect(screen.getAllByText('パン')).toHaveLength(2);
  });

  it('skips a bank index that does not resolve rather than crashing', () => {
    line([2, 99, 3]);
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  /* The line draws placed tiles and nothing else. Empty rules used to stand in
     for the tiles still to come, which both leaked the answer's length and tied
     the line to the canonical answer — so an alternate of another length was
     drawn against the wrong count. */
  it('is empty when nothing is placed, with no placeholder for what is coming', () => {
    const { container } = line([]);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('[data-slot]')).toHaveLength(0);
  });

  it('draws no placeholders at any length, so an answer of any size fits', () => {
    for (const placed of [[], [2], [2, 3], [2, 3, 0], [2, 3, 0, 1]]) {
      const { container } = line(placed);
      expect(container.querySelectorAll('[data-slot]')).toHaveLength(0);
    }
  });
});
