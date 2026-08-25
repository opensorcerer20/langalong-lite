/* One situation on the home screen: a full-width row, ruled off from the next. */

import type { Scenario } from '../../data/types';
import styles from './ScenarioRow.module.css';

export interface ScenarioRowProps {
  readonly scenario: Scenario;
  readonly onOpen: () => void;
}

export function ScenarioRow({ scenario, onOpen }: ScenarioRowProps) {
  const count = scenario.items.length;

  return (
    <button type="button" className={styles.row} onClick={onOpen}>
      <div className={styles.top}>
        <span className={styles.kicker}>{scenario.kicker}</span>
        <span className={styles.count}>
          {count} {count === 1 ? 'sentence' : 'sentences'}
        </span>
      </div>
      <div className={styles.name}>{scenario.name}</div>
      <div className={styles.blurb}>{scenario.blurb}</div>
    </button>
  );
}
