import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DrillActions } from '../../src/components/DrillActions/DrillActions';

const actions = (props: Partial<Parameters<typeof DrillActions>[0]> = {}) => {
  const handlers = { onCheck: vi.fn(), onNext: vi.fn(), onReveal: vi.fn() };
  render(
    <DrillActions
      done={false}
      isLastItem={false}
      canCheck
      showReveal={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

const primary = () => screen.getByRole('button', { name: /check|next sentence|finish set/i });

describe('DrillActions', () => {
  it('checks the answer while the item is open', async () => {
    const { onCheck, onNext } = actions();
    expect(primary()).toHaveTextContent('Check');
    await userEvent.click(primary());
    expect(onCheck).toHaveBeenCalledOnce();
    expect(onNext).not.toHaveBeenCalled();
  });

  /* One button, two jobs — it advances once the answer is settled. */
  it('advances once the answer is settled', async () => {
    const { onCheck, onNext } = actions({ done: true });
    expect(primary()).toHaveTextContent('Next sentence');
    await userEvent.click(primary());
    expect(onNext).toHaveBeenCalledOnce();
    expect(onCheck).not.toHaveBeenCalled();
  });

  it('finishes the set on the last item', () => {
    actions({ done: true, isLastItem: true });
    expect(primary()).toHaveTextContent('Finish set');
  });

  it('still reads "Check" on the last item until the answer is settled', () => {
    actions({ isLastItem: true });
    expect(primary()).toHaveTextContent('Check');
  });

  it('cannot check an empty answer line', () => {
    actions({ canCheck: false });
    expect(primary()).toBeDisabled();
  });

  it('stays enabled to advance even though nothing is placed', () => {
    actions({ done: true, canCheck: false });
    expect(primary()).toBeEnabled();
  });

  it('hides the reveal button until enough misses', () => {
    actions();
    expect(screen.queryByRole('button', { name: /show me the answer/i })).not.toBeInTheDocument();
  });

  it('reveals the answer when asked', async () => {
    const { onReveal } = actions({ showReveal: true });
    await userEvent.click(screen.getByRole('button', { name: /show me the answer/i }));
    expect(onReveal).toHaveBeenCalledOnce();
  });
});
