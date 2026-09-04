/* The situations, one ruled row each. */

import type { DrillScenario } from '../data/drill';
import { ScenarioRow } from './ScenarioRow';

export interface ScenarioListProps {
  readonly scenarios: readonly DrillScenario[];
  /** Called with the scenario's index, which is how state identifies it. */
  readonly onOpen: (index: number) => void;
}

export function ScenarioList({ scenarios, onOpen }: ScenarioListProps) {
  return (
    <nav aria-label="Situations">
      {scenarios.map((scenario, index) => (
        <ScenarioRow key={scenario.name} scenario={scenario} onOpen={() => onOpen(index)} />
      ))}
    </nav>
  );
}
