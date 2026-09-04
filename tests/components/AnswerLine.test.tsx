import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AnswerLine } from '../../src/components/AnswerLine';
import type { Tile } from '../../src/data/drill';
import { tile } from '../helpers/fixtures';

const BANK: readonly Tile[] = [
  tile('ください', 'kudasai', 'verb'),
  tile('は', 'wa', 'particle'),
  tile('パン', 'pan'),
  tile('を', 'o', 'particle'),
];

const line = (placed: number[], props: Partial<Parameters<typeof AnswerLine>[0]> = {}) =>
  render(
    <AnswerLine bank={BANK} placed={placed} length={3} onRemove={() => {}} {...props} />,
  );

describe('AnswerLine', () => {
  it('shows the placed tiles in the order they were placed', () => {
    line([2, 3, 0]);
    const tiles = screen.getAllByRole('button').map((b) => b.textContent);
    expect(tiles).toEqual(['パンpan', 'をo', 'くださいkudasai']);
  });

  /* The empty rules are how the learner sees how much sentence is left. */
  it('shows one empty slot per tile still to come', () => {
    const { container } = line([2]);
    expect(container.querySelectorAll('[data-slot]')).toHaveLength(2);
  });

  /* Full, and past full. Note that only the first half of this can fail: with
     more placed than the sentence needs, `remaining` goes negative, and
     Array.from({ length: -1 }) is already [] — so the Math.max(0, …) guard in
     AnswerLine is unobservable from here and the overfull case documents the
     intent rather than defending it. Kept for that reason, not mistaken for
     coverage. */
  it('shows no slots once the line is full, however many are placed', () => {
    const { container: full } = line([2, 3, 0]);
    expect(full.querySelectorAll('[data-slot]')).toHaveLength(0);

    const { container: overfull } = line([2, 3, 0, 1]);
    expect(overfull.querySelectorAll('[data-slot]')).toHaveLength(0);
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

  it('is all slots when nothing is placed yet', () => {
    const { container } = line([]);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('[data-slot]')).toHaveLength(3);
  });
});
