import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Tile } from '../../src/components/Tile';
import { tile } from '../helpers/fixtures';

const PAN = tile('パン', 'pan');

describe('Tile', () => {
  it('shows the kana and its romaji', () => {
    render(<Tile tile={PAN} variant="bank" />);
    expect(screen.getByRole('button')).toHaveTextContent('パン');
    expect(screen.getByRole('button')).toHaveTextContent('pan');
  });

  it('hides the romaji when it is turned off', () => {
    render(<Tile tile={PAN} variant="bank" showReading={false} />);
    expect(screen.getByRole('button')).toHaveTextContent('パン');
    expect(screen.getByRole('button')).not.toHaveTextContent('pan');
  });

  it('calls back when tapped', async () => {
    const onClick = vi.fn();
    render(<Tile tile={PAN} variant="bank" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not respond when disabled', async () => {
    const onClick = vi.fn();
    render(<Tile tile={PAN} variant="bank" disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  /* A used bank tile is hidden but still occupies its space, so it must also
     leave the tab order and the accessibility tree — otherwise keyboard and
     screen-reader users can reach a tile that is not visibly there. */
  it('takes a used tile out of the tab order and the a11y tree', () => {
    const { container } = render(<Tile tile={PAN} variant="bank" used />);
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('data-used');
    expect(button).toHaveAttribute('tabindex', '-1');
    expect(button).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves an unused tile reachable', () => {
    const { container } = render(<Tile tile={PAN} variant="bank" />);
    const button = container.querySelector('button');
    expect(button).not.toHaveAttribute('data-used');
    expect(button).not.toHaveAttribute('aria-hidden');
  });

  it('says which row it belongs to', () => {
    const { container: bank } = render(<Tile tile={PAN} variant="bank" />);
    const { container: placed } = render(<Tile tile={PAN} variant="placed" />);
    expect(bank.querySelector('button')).toHaveAttribute('data-variant', 'bank');
    expect(placed.querySelector('button')).toHaveAttribute('data-variant', 'placed');
  });

  it('styles the two variants differently', () => {
    const { container: bank } = render(<Tile tile={PAN} variant="bank" />);
    const { container: placed } = render(<Tile tile={PAN} variant="placed" />);
    expect(bank.querySelector('button')?.className).not.toBe(
      placed.querySelector('button')?.className,
    );
  });

  /* A settled tile must not light up under the cursor. That guard is the
     `:hover:not(:disabled)` condition in Tile's stylesheet, which jsdom does not
     evaluate — so it is verified against the emitted CSS at build time, not
     here. What this file can assert is the behavioural half: a disabled tile
     carries the disabled attribute and ignores clicks (above). */

  it('is a plain button, so it never submits anything', () => {
    render(<Tile tile={PAN} variant="bank" />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
