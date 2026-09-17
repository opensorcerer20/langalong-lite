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

export interface AppProps {
  /** The pack to drill, resolved by the caller from a ContentSource. */
  readonly language: LanguagePack;
  /** Where attempts are recorded. Omitted, the drill runs and records nothing. */
  readonly progress?: ProgressStore;
  /**
   * Whether that store survives the session — `Repository.durable`. False when
   * IndexedDB could not be opened and progress is being kept in memory, which
   * the header then says out loud.
   *
   * Defaults to true, so a caller that has no store to speak of — a component
   * test, mainly — does not accidentally claim the app is failing to save.
   */
  readonly durable?: boolean;
}

/* Short enough for the header's uppercase slot, and about the consequence
   rather than the cause: "IndexedDB is unavailable" is not the learner's
   problem to hold. */
const NOT_SAVING = 'Not saving';

export function App({ language: pack, progress, durable = true }: AppProps) {
  const tsumiki = useTsumiki(pack, progress);
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
        notice={durable ? undefined : NOT_SAVING}
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
