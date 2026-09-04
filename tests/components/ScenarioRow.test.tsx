import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ScenarioRow } from '../../src/components/ScenarioRow';
import { drillItem, drillScenario, tile } from '../helpers/fixtures';

<<<<<<< HEAD
const item = (id: string, en: string): SentenceItem => ({
  id,
  en,
  ans: [['パン', 'pan']],
  note: 'A note.',
  tags: { particles: [], conjugations: [] },
});

const BAKERY: Scenario = {
=======
const item = (promptText: string) => drillItem({ promptText, answer: [tile('パン', 'pan')] });

const BAKERY = drillScenario({
>>>>>>> rewrite-01
  id: 'bakery',
  name: 'Bakery',
  blurb: 'Asking for items, counting them, paying at the counter.',
<<<<<<< HEAD
  items: [item('01', 'One bread, please.'), item('02', 'How much is this?')],
  words: [['パン', 'pan']],
};
=======
  items: [item('One bread, please.'), item('How much is this?')],
  words: [tile('パン', 'pan')],
});
>>>>>>> rewrite-01

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
<<<<<<< HEAD
    const single: Scenario = { ...BAKERY, items: [item('01', 'One bread, please.')] };
=======
    const single = { ...BAKERY, items: [item('One bread, please.')] };
>>>>>>> rewrite-01
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
