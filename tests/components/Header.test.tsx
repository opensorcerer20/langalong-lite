import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Header } from '../../src/components/Header';

describe('Header', () => {
  it('is a banner showing the wordmark and the label', () => {
    render(<Header label="Bakery · 01" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByText('TSUMIKI')).toBeInTheDocument();
    expect(screen.getByText('Bakery · 01')).toBeInTheDocument();
  });

  /* There is nowhere to go back to from the home screen. */
  it('has no back link when no way back is given', () => {
    render(<Header label="Japanese · beginner" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('goes back when there is somewhere to go', async () => {
    const onBack = vi.fn();
    render(<Header label="Bakery · 01" onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: /all/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('draws a notice beside the label', () => {
    render(<Header label="Bakery · 01" notice="Not saving" />);
    expect(screen.getByText('Not saving')).toBeInTheDocument();
    expect(screen.getByText('Bakery · 01')).toBeInTheDocument();
  });

  it('draws nothing where the notice would be when there is none', () => {
    render(<Header label="Bakery · 01" />);
    expect(screen.queryByText('Not saving')).not.toBeInTheDocument();
  });

  /* The drill's status line is a live region and this is not — two of those
     competing would announce a standing condition as though it just changed. */
  it('is not a live region', () => {
    render(<Header label="Bakery · 01" notice="Not saving" />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
