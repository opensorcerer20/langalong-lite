/* The situations, one ruled row each. */

import type { Scenario } from '../data/types';
import { ScenarioRow } from './ScenarioRow';

export interface ScenarioListProps {
  readonly scenarios: readonly Scenario[];
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
