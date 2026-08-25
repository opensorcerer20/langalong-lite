/* The app surface: a 460px column with ruled edges on a darker ground, so it
   reads as a phone even on a desktop screen. */

import * as stylex from '@stylexjs/stylex';
import type { ReactNode } from 'react';

export interface PhoneColumnProps {
  readonly children: ReactNode;
}

export function PhoneColumn({ children }: PhoneColumnProps) {
  return (
    <div {...stylex.props(s.frame)}>
      <div {...stylex.props(s.column)}>{children}</div>
    </div>
  );
}

const s = stylex.create({
  frame: {
    minHeight: '100dvh',
    display: 'flex',
    justifyContent: 'center',
  },

  column: {
    width: '100%',
    maxWidth: 460,
    minHeight: '100dvh',
    backgroundColor: 'var(--color-bg)',
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    borderLeftColor: 'var(--color-divider)',
    borderRightWidth: 2,
    borderRightStyle: 'solid',
    borderRightColor: 'var(--color-divider)',
    display: 'flex',
    flexDirection: 'column',
    /* Keeps the actions clear of the home indicator on a notched phone. */
    paddingBottom: 'env(safe-area-inset-bottom)',
  },
});
