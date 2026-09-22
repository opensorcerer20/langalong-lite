/* The app surface: a 460px column, so it reads as a phone on a desktop too.

   Sets --font-target from the language pack, because StyleX values are static.
   The inline style merges onto the one stylex.props already returns. */

import * as stylex from '@stylexjs/stylex';
import type { CSSProperties, ReactNode } from 'react';

export interface PhoneColumnProps {
  readonly children: ReactNode;
  /**
   * Font families for target-language text, from the language pack. Omitted,
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
    /* Fixed, not minimum: the screen inside decides what scrolls, so the drill
       cannot grow past the fold and take the Check button with it. */
    height: '100dvh',
    overflow: 'hidden',
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
