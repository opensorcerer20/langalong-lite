import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScenarioList } from '../../src/components/ScenarioList';
import type { Scenario } from '../../src/data/types';

const scenario = (name: string, kicker: string): Scenario => ({
  name,
  kicker,
  blurb: `About ${name}.`,
  items: [{ en: 'One bread, please.', ans: [['パン', 'pan']], note: 'A note.' }],
  words: [['パン', 'pan']],
});

const SCENARIOS = [scenario('Bakery', 'Set 01'), scenario('Train station', 'Set 02')];

describe('ScenarioList', () => {
  it('lists every scenario in order', () => {
    render(<ScenarioList scenarios={SCENARIOS} onOpen={() => {}} />);
    const rows = screen.getAllByRole('button');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('Bakery');
    expect(rows[1]).toHaveTextContent('Train station');
  });

  /* State identifies a scenario by its index, so that is what comes back. */
  it('opens a scenario by its index', async () => {
    const onOpen = vi.fn();
    render(<ScenarioList scenarios={SCENARIOS} onOpen={onOpen} />);
    await userEvent.click(screen.getByText('Train station'));
    expect(onOpen).toHaveBeenCalledWith(1);
  });

  it('is a navigation landmark', () => {
    render(<ScenarioList scenarios={SCENARIOS} onOpen={() => {}} />);
    expect(screen.getByRole('navigation', { name: /situations/i })).toBeInTheDocument();
  });

  it('renders nothing when there are no scenarios', () => {
    render(<ScenarioList scenarios={[]} onOpen={() => {}} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
