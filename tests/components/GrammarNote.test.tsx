import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { GrammarNote } from '../../src/components/GrammarNote';

const NOTE = 'を marks the direct object — the thing you are asking for.';

describe('GrammarNote', () => {
  /* Same note, two jobs: help while the learner is stuck, commentary once they
     are through. Only the label distinguishes them. An aside either way, so it
     is skippable. */
  it('shows the note as skippable help while the item is still open', () => {
    render(<GrammarNote note={NOTE} done={false} />);
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getByText('Grammar')).toBeInTheDocument();
    expect(screen.queryByText('Additional grammar tips')).not.toBeInTheDocument();
  });

  it('is relabelled as commentary once the answer is settled', () => {
    render(<GrammarNote note={NOTE} done />);
    expect(screen.getByText(NOTE)).toBeInTheDocument();
    expect(screen.getByText('Additional grammar tips')).toBeInTheDocument();
    expect(screen.queryByText('Grammar')).not.toBeInTheDocument();
  });
});
