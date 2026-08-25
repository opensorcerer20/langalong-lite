/* The whole app in one screenful: state comes from the hook, and which of the
   three screens is showing follows from it. */

import { useTsumiki } from '../../state/useTsumiki';
import { DoneScreen } from '../DoneScreen/DoneScreen';
import { DrillScreen } from '../DrillScreen/DrillScreen';
import { Header } from '../Header/Header';
import { HomeScreen } from '../HomeScreen/HomeScreen';
import { PhoneColumn } from '../PhoneColumn/PhoneColumn';
import { ProgressBar } from '../ProgressBar/ProgressBar';

/* Static chrome: nothing is persisted between sessions yet. */
const STREAK = 'Day 12';

export function App() {
  const tsumiki = useTsumiki();
  const { state, scenario, scenarios, total } = tsumiki;

  const inDrill = state.screen === 'drill';

  return (
    <PhoneColumn>
      <Header
        label={inDrill ? `${scenario.name} · ${scenario.kicker.replace('Set ', '')}` : 'Japanese · beginner'}
        streak={STREAK}
        onBack={inDrill ? tsumiki.goHome : undefined}
      />

      <ProgressBar value={inDrill ? tsumiki.progress : 0} />

      {!inDrill && <HomeScreen scenarios={scenarios} onOpen={tsumiki.openScenario} />}

      {inDrill && !state.finished && <DrillScreen tsumiki={tsumiki} />}

      {inDrill && state.finished && (
        <DoneScreen
          firstTry={state.firstTry}
          total={total}
          onRestart={tsumiki.restart}
          onHome={tsumiki.goHome}
        />
      )}
    </PhoneColumn>
  );
}
