/* The app surface: a 460px column with ruled edges on a darker ground, so it
   reads as a phone even on a desktop screen. */

import type { ReactNode } from 'react';

import styles from './PhoneColumn.module.css';

export interface PhoneColumnProps {
  readonly children: ReactNode;
}

export function PhoneColumn({ children }: PhoneColumnProps) {
  return (
    <div className={styles.frame}>
      <div className={styles.column}>{children}</div>
    </div>
  );
}
