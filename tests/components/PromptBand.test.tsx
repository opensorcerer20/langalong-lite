import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PromptBand } from '../../src/components/PromptBand';

describe('PromptBand', () => {
  it('shows the English sentence to build as the heading', () => {
    render(<PromptBand language="Japanese" prompt="One bread, please." index={0} total={10} />);
    expect(screen.getByRole('heading')).toHaveTextContent('One bread, please.');
  });

  /* The index is zero-based in state but one-based on screen. */
  it('counts from one, not from zero', () => {
    render(<PromptBand language="Japanese" prompt="One bread, please." index={0} total={10} />);
    expect(screen.getByText(/item 1 of 10/)).toBeInTheDocument();
  });

  it('reads the last item as the total', () => {
    render(<PromptBand language="Japanese" prompt="What do you recommend?" index={9} total={10} />);
    expect(screen.getByText(/item 10 of 10/)).toBeInTheDocument();
  });
});
