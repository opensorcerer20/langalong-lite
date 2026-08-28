import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DoneScreen } from '../../src/components/DoneScreen';

const done = (props: Partial<Parameters<typeof DoneScreen>[0]> = {}) => {
  const handlers = { onRestart: vi.fn(), onHome: vi.fn() };
  render(<DoneScreen firstTry={7} total={10} {...handlers} {...props} />);
  return handlers;
};

describe('DoneScreen', () => {
  /* One render, one screen: the heading, the score, and what the score is
     counting — which is not "answered" but "built with no prior miss". There is
     no branch on the score, so 10/10 and 0/10 exercise nothing 7/10 does not;
     a full set is asserted end to end in App.test.tsx. */
  it('reports the set complete and the score it was built with', () => {
    done();
    expect(screen.getByText('Set complete')).toBeInTheDocument();
    expect(screen.getByText('7 / 10')).toBeInTheDocument();
    expect(screen.getByText('built first try')).toBeInTheDocument();
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

  /* The copy is props so that an exercise which does not finish "sentences" can
     say what it did finish. The defaults above are the sentence drill's, which
     is why every other test here passes none. */
  describe('as a success screen for another exercise', () => {
    it('takes its wording from the caller', () => {
      done({
        title: 'Vocabulary complete',
        scoreLabel: 'recalled first try',
        body: 'Next up: the particles that hold them together.',
      });

      expect(screen.getByText('Vocabulary complete')).toBeInTheDocument();
      expect(screen.getByText('recalled first try')).toBeInTheDocument();
      expect(screen.getByText(/particles that hold them together/)).toBeInTheDocument();
      expect(screen.queryByText('Set complete')).not.toBeInTheDocument();
    });

    it('keeps the score, which means the same thing for every exercise', () => {
      done({ title: 'Vocabulary complete' });
      expect(screen.getByText('7 / 10')).toBeInTheDocument();
    });
  });
});
