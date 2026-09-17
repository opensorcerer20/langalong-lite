import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScenarioList } from '../../src/components/ScenarioList';
import type { Scenario } from '../../src/data/types';

const scenario = (name: string, kicker: string, id?: string): Scenario => ({
  id: id ?? name.toLowerCase().replace(/\W+/g, '-'),
  name,
  kicker,
  blurb: `About ${name}.`,
  items: [
    {
      id: '01',
      en: 'One bread, please.',
      ans: [['パン', 'pan']],
      note: 'A note.',
      tags: { particles: [], conjugations: [] },
    },
  ],
  words: [['パン', 'pan']],
});

const SCENARIOS = [scenario('Bakery', 'Set 01'), scenario('Train station', 'Set 02')];

describe('ScenarioList', () => {
  it('is a navigation landmark listing every scenario in order', () => {
    render(<ScenarioList scenarios={SCENARIOS} onOpen={() => {}} />);
    expect(screen.getByRole('navigation', { name: /situations/i })).toBeInTheDocument();
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

  /* Two situations may legitimately share a name — `id` is what the pack
     guarantees unique, so it is what the rows are keyed on. Keying on `name`
     made React treat these as one row. */
  describe('when two situations share a name', () => {
    const SAME_NAME = [
      scenario('Market', 'Set 01', 'market-morning'),
      scenario('Market', 'Set 02', 'market-evening'),
    ];

    it('renders both, and opens each by its own index', async () => {
      const onOpen = vi.fn();
      render(<ScenarioList scenarios={SAME_NAME} onOpen={onOpen} />);

      const rows = screen.getAllByRole('button');
      expect(rows).toHaveLength(2);

      await userEvent.click(rows[1]!);
      expect(onOpen).toHaveBeenCalledWith(1);
    });

    it('gives React distinct keys, so neither row is dropped or reused', () => {
      const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
      render(<ScenarioList scenarios={SAME_NAME} onOpen={() => {}} />);

      const warned = errors.mock.calls.some((args) => String(args[0]).includes('same key'));
      errors.mockRestore();
      expect(warned).toBe(false);
    });
  });
});
