import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScenarioRow } from '../../src/components/ScenarioRow/ScenarioRow';
import type { Scenario, SentenceItem } from '../../src/data/types';

const item = (en: string): SentenceItem => ({
  en,
  ans: [['パン', 'pan']],
  note: 'A note.',
});

const BAKERY: Scenario = {
  name: 'Bakery',
  kicker: 'Set 01',
  blurb: 'Asking for items, counting them, paying at the counter.',
  items: [item('One bread, please.'), item('How much is this?')],
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
    const single: Scenario = { ...BAKERY, items: [item('One bread, please.')] };
    render(<ScenarioRow scenario={single} onOpen={() => {}} />);
    expect(screen.getByText('1 sentence')).toBeInTheDocument();
  });

  it('opens the set when tapped', async () => {
    const onOpen = vi.fn();
    render(<ScenarioRow scenario={BAKERY} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('is one button, so the whole row is the target', () => {
    render(<ScenarioRow scenario={BAKERY} onOpen={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('Bakery');
    expect(button).toHaveTextContent(BAKERY.blurb);
  });
});
