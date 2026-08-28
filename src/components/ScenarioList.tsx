/* The situations, one ruled row each. */

import type { Scenario } from '../data/types';
import type { ExerciseMode } from '../lib/progress';
import { ScenarioRow } from './ScenarioRow';

export interface ScenarioListProps {
  readonly scenarios: readonly Scenario[];
  /** Called with the scenario's index — how state identifies it — and which
      exercise of that scenario to open. */
  readonly onOpen: (index: number, mode: ExerciseMode) => void;
}

export function ScenarioList({ scenarios, onOpen }: ScenarioListProps) {
  return (
    <nav aria-label="Situations">
      {scenarios.map((scenario, index) => (
        <ScenarioRow
          key={scenario.name}
          scenario={scenario}
          onOpen={(mode) => onOpen(index, mode)}
        />
      ))}
    </nav>
  );
}
