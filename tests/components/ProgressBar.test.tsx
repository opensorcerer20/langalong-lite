import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  render,
  screen,
} from '@testing-library/react';

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

  it('reads empty at the start and full at the end', () => {
    const { rerender } = render(<ProgressBar value={0} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
    rerender(<ProgressBar value={1} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '100');
  });

  it('clamps a value outside 0–1 rather than overflowing the rule', () => {
    const { rerender } = render(<ProgressBar value={1.8} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '100');
    rerender(<ProgressBar value={-0.4} />);
    expect(bar()).toHaveAttribute('aria-valuenow', '0');
  });

  it('fills to the matching width', () => {
    const { container } = render(<ProgressBar value={0.25} />);
    expect(container.querySelector('[role="progressbar"] > div')).toHaveStyle({ width: '25%' });
  });
});
