/* The whole app in one screenful: state comes from the hooks, and which screen
   is showing follows from it.

   Both hooks are called unconditionally, as the rules of hooks require, and
   only one of them is driving at a time — `state.mode` says which. They share
   one reducer: useTsumiki owns it and useExercise is handed its state and
   dispatch, so the score and the position in the set mean the same thing
   whichever exercise is running. */

import type { LanguagePack } from '../data/types';
import type { ExerciseMode } from '../lib/progress';
import { useExercise } from '../state/useExercise';
import { useTsumiki } from '../state/useTsumiki';
import type { ProgressStore } from '../storage/types';
import { DoneScreen } from './DoneScreen';
import { DrillScreen } from './DrillScreen';
import { ExerciseScreen } from './ExerciseScreen';
import { Header } from './Header';
import { HomeScreen } from './HomeScreen';
import { PhoneColumn } from './PhoneColumn';
import { ProgressBar } from './ProgressBar';

/* Still static. Progress is now recorded, but a streak is a property of the
   days a learner studied rather than of what they answered, and that record is
   not kept — see the session row left out of the storage schema on purpose. */
const STREAK = 'Day 12';

/** How each exercise names itself in the header and on the done screen. */
const EXERCISE = {
  sentence: { header: '', instruction: '', done: 'Set complete', score: 'built first try' },
  vocab: {
    header: 'Vocabulary',
    instruction: 'Choose the missing word',
    done: 'Vocabulary complete',
    score: 'recalled first try',
  },
  particle: {
    header: 'Particles',
    instruction: 'Choose the right particle',
    done: 'Particles complete',
    score: 'chosen first try',
  },
  conjugation: {
    header: 'Conjugation',
    instruction: 'Build the form',
    done: 'Conjugation complete',
    score: 'built first try',
  },
} satisfies Record<ExerciseMode, unknown>;

export interface AppProps {
  /** The pack to drill, resolved by the caller from a ContentSource. */
  readonly language: LanguagePack;
  /** Where attempts are recorded. Omitted, the drill runs and records nothing. */
  readonly progress?: ProgressStore;
}

export function App({ language: pack, progress }: AppProps) {
  const tsumiki = useTsumiki(pack, progress);
  const { state, language, scenario, scenarios } = tsumiki;

  const exercise = useExercise({
    language,
    scenario,
    mode: state.mode,
    state,
    dispatch: tsumiki.dispatch,
    progress,
  });

  const inDrill = state.screen === 'drill';
  const isSentence = state.mode === 'sentence';
  const copy = EXERCISE[state.mode];

  /* Whichever hook is driving supplies the numbers the chrome reads. */
  const total = isSentence ? tsumiki.total : exercise.total;
  const value = isSentence ? tsumiki.progress : exercise.progress;
  const restart = isSentence ? tsumiki.restart : exercise.restart;

  return (
    <PhoneColumn fontStack={language.fontStack}>
      <Header
        label={
          inDrill
            ? `${scenario.name} · ${isSentence ? scenario.kicker.replace('Set ', '') : copy.header}`
            : /* The level is the app's, not the language's — every pack starts
                 a learner at the beginning. */
              `${language.name} · beginner`
        }
        streak={STREAK}
        onBack={inDrill ? tsumiki.goHome : undefined}
      />

      <ProgressBar value={inDrill ? value : 0} />

      {!inDrill && <HomeScreen scenarios={scenarios} onOpen={tsumiki.openExercise} />}

      {inDrill && !state.finished && isSentence && <DrillScreen tsumiki={tsumiki} />}

      {inDrill && !state.finished && !isSentence && exercise.question && (
        <ExerciseScreen
          exercise={exercise}
          question={exercise.question}
          language={language}
          index={state.item}
          misses={state.misses}
          placed={state.placed}
          status={state.status}
          instruction={copy.instruction}
        />
      )}

      {inDrill && state.finished && (
        <DoneScreen
          firstTry={state.firstTry}
          total={total}
          title={copy.done}
          scoreLabel={copy.score}
          body={
            isSentence
              ? 'Next set unlocks the response level: a shopkeeper speaks first and you build the reply.'
              : 'Head back and build the sentences these words belong to.'
          }
          onRestart={restart}
          onHome={tsumiki.goHome}
        />
      )}
    </PhoneColumn>
  );
}
