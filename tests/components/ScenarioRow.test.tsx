import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScenarioRow } from '../../src/components/ScenarioRow';
import type { Scenario, SentenceItem } from '../../src/data/types';

const item = (id: string, en: string): SentenceItem => ({
  id,
  en,
  ans: [['パン', 'pan']],
  note: 'A note.',
  tags: { particles: [], conjugations: [] },
});

const BAKERY: Scenario = {
  id: 'bakery',
  name: 'Bakery',
  kicker: 'Set 01',
  blurb: 'Asking for items, counting them, paying at the counter.',
  items: [item('01', 'One bread, please.'), item('02', 'How much is this?')],
  words: [['パン', 'pan']],
};

describe('ScenarioRow', () => {
  it('shows the set number, name and blurb', () => {
    render(<ScenarioRow scenario={BAKERY} onOpen={() => {}} />);
    expect(screen.getByText('Set 01')).toBeInTheDocument();
    expect(screen.getByText('Bakery')).toBeInTheDocument();
    expect(screen.getByText(BAKERY.blurb)).toBeInTheDocument();
  });

  it('counts the sentences in the set', () => {
    render(<ScenarioRow scenario={BAKERY} onOpen={() => {}} />);
    expect(screen.getByText('2 sentences')).toBeInTheDocument();
  });

  it('does not say "1 sentences"', () => {
    const single: Scenario = { ...BAKERY, items: [item('01', 'One bread, please.')] };
    render(<ScenarioRow scenario={single} onOpen={() => {}} />);
    expect(screen.getByText('1 sentence')).toBeInTheDocument();
  });

  /* The row did what it always did before the exercises were added: tapping
     the heading block builds the situation's sentences. */
  it('opens the sentence drill when the row is tapped', async () => {
    const onOpen = vi.fn();
    render(<ScenarioRow scenario={BAKERY} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Bakery — build sentences' }));
    expect(onOpen).toHaveBeenCalledWith('sentence');
  });

  it('keeps the whole heading block as that one target', () => {
    render(<ScenarioRow scenario={BAKERY} onOpen={() => {}} />);
    const row = screen.getByRole('button', { name: 'Bakery — build sentences' });
    expect(row).toHaveTextContent('Bakery');
    expect(row).toHaveTextContent(BAKERY.blurb);
    expect(row).toHaveTextContent('Set 01');
  });

  describe('the exercises under it', () => {
    it('offers the situation’s other exercises', async () => {
      const onOpen = vi.fn();
      render(<ScenarioRow scenario={BAKERY} onOpen={onOpen} />);
      await userEvent.click(screen.getByRole('button', { name: 'Vocabulary — Bakery' }));
      expect(onOpen).toHaveBeenCalledWith('vocab');
    });

    /* Every situation offers the same exercises, so "Vocabulary" alone names
       several buttons on the home screen. The situation is what tells them
       apart for anyone navigating by name. */
    it('names each one with the situation it belongs to', () => {
      render(<ScenarioRow scenario={BAKERY} onOpen={() => {}} />);
      expect(screen.getByRole('button', { name: /Bakery$/ })).toHaveTextContent('Vocabulary');
    });

    /* A button cannot contain another button, which is why the row stopped
       being one. Nesting them would render, and then behave unpredictably. */
    it('sits beside the row button rather than inside it', () => {
      render(<ScenarioRow scenario={BAKERY} onOpen={() => {}} />);
      const row = screen.getByRole('button', { name: 'Bakery — build sentences' });
      expect(row.querySelector('button')).toBeNull();
    });
  });
});
