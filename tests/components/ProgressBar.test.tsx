import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProgressBar } from '../../src/components/ProgressBar';

const bar = () => screen.getByRole('progressbar');

describe('ProgressBar', () => {
  it('reports how far through the set it is', () => {
    render(<ProgressBar value={0.5} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '50');
  });

  it('rounds to whole percent', () => {
    render(<ProgressBar value={1 / 3} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '33');
  });

  /* The ends of the range, and past them: a value outside 0–1 is clamped rather
     than allowed to overflow the rule. */
  it('reads empty and full at the ends, and clamps beyond them', () => {
    const { rerender } = render(<ProgressBar value={0} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
    rerender(<ProgressBar value={1} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '100');
    rerender(<ProgressBar value={1.8} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '100');
    rerender(<ProgressBar value={-0.4} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
  });

  it('fills to the matching width', () => {
    const { container } = render(<ProgressBar value={0.25} />);
    expect(container.querySelector('[role="progressbar"] > div')).toHaveStyle({ width: '25%' });
  });
});
