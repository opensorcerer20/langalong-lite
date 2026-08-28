import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HomeScreen } from '../../src/components/HomeScreen';
import { LANGUAGE } from '../../src/data/languages';

describe('HomeScreen', () => {
  it('leads with the invitation to choose a situation', () => {
    render(<HomeScreen scenarios={LANGUAGE.scenarios} onOpen={() => {}} />);
    expect(screen.getByText('Choose a situation')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(
      'Build sentences you will actually need.',
    );
  });

  it('lists the shipped situations', () => {
    render(<HomeScreen scenarios={LANGUAGE.scenarios} onOpen={() => {}} />);
    expect(screen.getByText('Bakery')).toBeInTheDocument();
    expect(screen.getByText('Train station')).toBeInTheDocument();
  });

  it('opens the situation that was tapped', async () => {
    const onOpen = vi.fn();
    render(<HomeScreen scenarios={LANGUAGE.scenarios} onOpen={onOpen} />);
    await userEvent.click(screen.getByText('Bakery'));
    expect(onOpen).toHaveBeenCalledWith(0, 'sentence');
  });

  /* The row and the chips under it do different things, and the difference is
     not obvious from the chips alone. */
  it('explains that a situation can be drilled whole or one exercise at a time', () => {
    render(<HomeScreen scenarios={LANGUAGE.scenarios} onOpen={() => {}} />);
    expect(screen.getByText(/pick an exercise underneath/i)).toBeInTheDocument();
  });

  it('offers each situation’s exercises as well as its sentences', async () => {
    const onOpen = vi.fn();
    render(<HomeScreen scenarios={LANGUAGE.scenarios} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Vocabulary — Bakery' }));
    expect(onOpen).toHaveBeenCalledWith(0, 'vocab');
  });
});
