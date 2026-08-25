/* Situation select — the app's front door. */

import type { Scenario } from '../../data/types';
import { ScenarioList } from '../ScenarioList/ScenarioList';
import styles from './HomeScreen.module.css';

export interface HomeScreenProps {
  readonly scenarios: readonly Scenario[];
  readonly onOpen: (index: number) => void;
}

export function HomeScreen({ scenarios, onOpen }: HomeScreenProps) {
  return (
    <section className="screen">
      <div className={styles.band}>
        <div className="kicker">Choose a situation</div>
        <h1 className={styles.display}>Build sentences you will actually need.</h1>
      </div>

      <ScenarioList scenarios={scenarios} onOpen={onOpen} />

      <p className={styles.foot}>
        Translate level only for now. The response level &mdash; where the shopkeeper or clerk
        speaks first &mdash; unlocks per situation.
      </p>
    </section>
  );
}
