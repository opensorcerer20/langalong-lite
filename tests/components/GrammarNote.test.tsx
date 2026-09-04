import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  render,
  screen,
} from '@testing-library/react';

import { GrammarNote } from '../../src/components/GrammarNote';

const NOTE = 'を marks the direct object — the thing you are asking for.';

describe('GrammarNote', () => {
  it('shows the note', () => {
    render(<GrammarNote note={NOTE} done={false} />);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
  });

  /* Same note, two jobs: help while the learner is stuck, commentary once they
     are through. Only the label distinguishes them. */
  it('is labelled as help while the item is still open', () => {
    render(<GrammarNote note={NOTE} done={false} />);
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.queryByText('Additional grammar tips')).not.toBeInTheDocument();
  });

  it('is relabelled as commentary once the answer is settled', () => {
    render(<GrammarNote note={NOTE} done />);
    expect(screen.getByText('Additional grammar tips')).toBeInTheDocument();
    expect(screen.queryByText('Grammar')).not.toBeInTheDocument();
  });

  it('is an aside, so it is skippable', () => {
    render(<GrammarNote note={NOTE} done={false} />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
  });
});
