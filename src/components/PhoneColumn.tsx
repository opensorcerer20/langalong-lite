/* The app surface: a 460px column with ruled edges on a darker ground, so it
   reads as a phone even on a desktop screen.

   It is also where the active language's font stack enters the tree. StyleX
   values are static — a family cannot be interpolated into a rule at runtime —
   so the pack sets --font-target here and Tile's rule reads it. The inline
   style has to be merged onto what stylex.props returns, which already carries
   a style object of its own. */

import * as stylex from '@stylexjs/stylex';
import type { CSSProperties, ReactNode } from 'react';

export interface PhoneColumnProps {
  readonly children: ReactNode;
  /**
   * Font families for new-language text, from the language pack. Omitted,
   * the --font-target fallback in global.css stands.
   */
  readonly fontStack?: string;
}

export function PhoneColumn({ children, fontStack }: PhoneColumnProps) {
  const column = stylex.props(s.column);

  return (
    <div {...stylex.props(s.frame)}>
      <div
        {...column}
        style={
          fontStack
            ? ({ ...column.style, '--font-target': fontStack } as CSSProperties)
            : column.style
        }
      >
        {children}
      </div>
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
