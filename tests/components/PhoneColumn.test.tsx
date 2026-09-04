import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  render,
  screen,
} from '@testing-library/react';

import { PhoneColumn } from '../../src/components/PhoneColumn';

describe('PhoneColumn', () => {
  it('renders what it is given', () => {
    render(
      <PhoneColumn>
        <p>Inside the column.</p>
      </PhoneColumn>,
    );
    expect(screen.getByText('Inside the column.')).toBeInTheDocument();
  });

  /* The ruled column inside a centring frame — two elements, not one. */
  it('wraps its children in a column inside a frame', () => {
    const { container } = render(
      <PhoneColumn>
        <p>Inside the column.</p>
      </PhoneColumn>,
    );
    const frame = container.firstElementChild;
    expect(frame?.children).toHaveLength(1);
    expect(frame?.firstElementChild?.textContent).toBe('Inside the column.');
  });

  /* How the language pack's font reaches Tile: StyleX values are static, so the
     family travels as a custom property set here rather than in the rule. */
  it('publishes the language pack’s font stack as --font-target', () => {
    const { container } = render(
      <PhoneColumn fontStack="'Noto Sans JP'">
        <p>Inside the column.</p>
      </PhoneColumn>,
    );
    const column = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(column.style.getPropertyValue('--font-target')).toBe("'Noto Sans JP'");
  });

  /* Omitted, the fallback in global.css stands — no empty declaration is
     written that would override it. */
  it('sets no custom property when no font stack is given', () => {
    const { container } = render(
      <PhoneColumn>
        <p>Inside the column.</p>
      </PhoneColumn>,
    );
    const column = container.firstElementChild?.firstElementChild as HTMLElement;
    expect(column.style.getPropertyValue('--font-target')).toBe('');
  });
});
