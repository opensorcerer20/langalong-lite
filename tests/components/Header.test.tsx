import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  render,
  screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Header } from '../../src/components/Header';

describe('Header', () => {
  it('shows the wordmark, the label and the streak', () => {
    render(<Header label="Bakery · 01" streak="Day 12" />);
    expect(screen.getByText('TSUMIKI')).toBeInTheDocument();
    expect(screen.getByText('Bakery · 01')).toBeInTheDocument();
    expect(screen.getByText('Day 12')).toBeInTheDocument();
  });

  /* There is nowhere to go back to from the home screen. */
  it('has no back link when no way back is given', () => {
    render(<Header label="Japanese · beginner" streak="Day 12" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('goes back when there is somewhere to go', async () => {
    const onBack = vi.fn();
    render(<Header label="Bakery · 01" streak="Day 12" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: /all/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('is a banner landmark', () => {
    render(<Header label="Bakery · 01" streak="Day 12" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});
