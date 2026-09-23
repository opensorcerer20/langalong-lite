/* The whole app in one screenful: state comes from the hook, and which of the
   three screens is showing follows from it. */

import type { LanguagePack } from '../data/types';
import { useTsumiki } from '../state/useTsumiki';
import { DoneScreen } from './DoneScreen';
import { DrillScreen } from './DrillScreen';
import { Header } from './Header';
import { HomeScreen } from './HomeScreen';
import { PhoneColumn } from './PhoneColumn';
import { ProgressBar } from './ProgressBar';

export interface AppProps {
  readonly language: LanguagePack;
}

export function App({ language: pack }: AppProps) {
  const tsumiki = useTsumiki(pack);
  const { state, language, scenario, scenarios, total } = tsumiki;

  const inDrill = state.screen === 'drill';

  return (
    <PhoneColumn fontStack={language.fontStack}>
      <Header
        label={
          inDrill
            ? `${scenario.name} · ${scenario.lessonNum}`
            : /* The level is the app's, not the language's — every pack starts
                 a learner at the beginning. */
              `${language.name} · beginner`
        }
        onBack={inDrill ? tsumiki.goHome : undefined}
      />

      <ProgressBar value={inDrill ? tsumiki.progress : 0} />

      {!inDrill && (
        <HomeScreen
          scenarios={scenarios}
          onOpen={tsumiki.openScenario}
          mode={state.mode}
          onModeChange={tsumiki.setMode}
        />
      )}

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
