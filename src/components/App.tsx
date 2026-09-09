/* The whole app in one screenful: state comes from the hook, and which of the
   three screens is showing follows from it. */

import type { LanguagePack } from '../data/types';
import { useTsumiki } from '../state/useTsumiki';
import type { ProgressStore } from '../storage/types';
import { DoneScreen } from './DoneScreen';
import { DrillScreen } from './DrillScreen';
import { Header } from './Header';
import { HomeScreen } from './HomeScreen';
import { PhoneColumn } from './PhoneColumn';
import { ProgressBar } from './ProgressBar';

/* Still static. Progress is now recorded, but a streak is a property of the
   days a learner studied rather than of what they answered, and that record is
   not kept — see the session row left out of the storage schema on purpose. */
const STREAK = 'Day 12';

export interface AppProps {
  /** The pack to drill, resolved by the caller from a ContentSource. */
  readonly language: LanguagePack;
  /** Where attempts are recorded. Omitted, the drill runs and records nothing. */
  readonly progress?: ProgressStore;
}

export function App({ language: pack, progress }: AppProps) {
  const tsumiki = useTsumiki(pack, progress);
  const { state, language, scenario, scenarios, total } = tsumiki;

  const inDrill = state.screen === 'drill';

  return (
    <PhoneColumn fontStack={language.fontStack}>
      <Header
        label={
          inDrill
            ? `${scenario.name} · ${scenario.kicker.replace('Set ', '')}`
            : /* The level is the app's, not the language's — every pack starts
                 a learner at the beginning. */
              `${language.name} · beginner`
        }
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
