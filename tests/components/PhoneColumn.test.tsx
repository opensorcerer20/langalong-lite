import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
});
