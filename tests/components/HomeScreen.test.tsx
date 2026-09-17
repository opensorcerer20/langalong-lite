/* The home screen renders one row per situation it is handed. Which situations
   ship is not its business, so these run on two invented ones — the previous
   version asserted "Bakery" and "Train station" by name, which made adding a
   third situation fail a component test. */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { HomeScreen } from '../../src/components/HomeScreen';
import type { Scenario } from '../../src/data/types';

const item = (id: string) => ({
  id,
  en: `Prompt ${id}`,
  ans: [
    ['あ', 'a'],
    ['い', 'i'],
  ] as const,
  tags: { particles: [], conjugations: [] },
});

const SCENARIOS: readonly Scenario[] = [
  {
    id: 'first',
    name: 'First situation',
    lessonNum: '01',
    blurb: 'What the first one covers.',
    items: [item('01'), item('02')],
    words: [],
  },
  {
    id: 'second',
    name: 'Second situation',
    lessonNum: '02',
    blurb: 'What the second one covers.',
    items: [item('01')],
    words: [],
  },
];

describe('HomeScreen', () => {
  it('leads with the invitation to choose a situation', () => {
    render(<HomeScreen scenarios={SCENARIOS} onOpen={() => {}} />);
    expect(screen.getByText('Choose a situation')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent(
      'Build sentences you will actually need.',
    );
  });

  it('renders a row per situation, whatever it is handed', () => {
    render(<HomeScreen scenarios={SCENARIOS} onOpen={() => {}} />);

    for (const scenario of SCENARIOS) {
      expect(screen.getByText(scenario.name)).toBeInTheDocument();
      expect(screen.getByText(scenario.blurb)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button')).toHaveLength(SCENARIOS.length);
  });

  it('opens the situation that was tapped, by its position', async () => {
    const onOpen = vi.fn();
    render(<HomeScreen scenarios={SCENARIOS} onOpen={onOpen} />);

    await userEvent.click(screen.getByText('Second situation'));
    expect(onOpen).toHaveBeenCalledWith(1);
  });

  /* Says how the drill works, and promises nothing that is not built. The copy
     used to announce a "response level" that unlocks per situation; there is no
     such level and nothing unlocks. */
  it('explains how a situation is played', () => {
    render(<HomeScreen scenarios={SCENARIOS} onOpen={() => {}} />);
    expect(screen.getByText(/read the English prompt/i)).toBeInTheDocument();
    expect(screen.queryByText(/unlocks|response level/i)).not.toBeInTheDocument();
  });
});
