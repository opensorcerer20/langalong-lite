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

import { DoneScreen } from '../../src/components/DoneScreen';

const done = (props: Partial<Parameters<typeof DoneScreen>[0]> = {}) => {
  const handlers = { onRestart: vi.fn(), onHome: vi.fn() };
  render(<DoneScreen firstTry={7} total={10} {...handlers} {...props} />);
  return handlers;
};

describe('DoneScreen', () => {
  it('shows the score out of the set size', () => {
    done();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
  });

  /* The score is not "answered" — it is built with no prior miss. */
  it('says what the score actually measures', () => {
    done();
    expect(screen.getByText('built first try')).toBeInTheDocument();
  });

  it('handles a perfect set and a blank one', () => {
    const { unmount } = render(
      <DoneScreen firstTry={10} total={10} onRestart={() => {}} onHome={() => {}} />,
    );
    expect(screen.getByText('10 / 10')).toBeInTheDocument();
    unmount();

    render(<DoneScreen firstTry={0} total={10} onRestart={() => {}} onHome={() => {}} />);
    expect(screen.getByText('0 / 10')).toBeInTheDocument();
  });

  it('offers to practise the set again', async () => {
    const { onRestart } = done();
    await userEvent.click(screen.getByRole('button', { name: /practise this set again/i }));
    expect(onRestart).toHaveBeenCalledOnce();
  });

  it('offers a way back to the situations', async () => {
    const { onHome } = done();
    await userEvent.click(screen.getByRole('button', { name: /choose another situation/i }));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('says the set is complete', () => {
    done();
    expect(screen.getByText('Set complete')).toBeInTheDocument();
  });
});
