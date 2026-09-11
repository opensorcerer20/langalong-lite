/* Situation select — the app's front door. */

import * as stylex from '@stylexjs/stylex';

import type { Scenario } from '../data/types';
import { shared } from '../styles/shared';
import { ScenarioList } from './ScenarioList';

export interface HomeScreenProps {
  readonly scenarios: readonly Scenario[];
  readonly onOpen: (index: number) => void;
}

export function HomeScreen({ scenarios, onOpen }: HomeScreenProps) {
  return (
    <section {...stylex.props(shared.screen)}>
      <div {...stylex.props(s.band)}>
        <div {...stylex.props(shared.kicker)}>Choose a situation</div>
        <h1 {...stylex.props(s.display)}>Build sentences you will actually need.</h1>
      </div>

      <ScenarioList scenarios={scenarios} onOpen={onOpen} />

      <p {...stylex.props(s.foot)}>
        Every situation works the same way: read the English prompt, then build the sentence from
        the tiles. Sets can be replayed as often as you like.
      </p>
    </section>
  );
}

const s = stylex.create({
  band: {
    paddingTop: 26,
    paddingRight: 20,
    paddingBottom: 22,
    paddingLeft: 20,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
  },

  display: {
    marginTop: 0,
    marginBottom: 0,
    fontFamily: 'var(--font-heading)',
    fontWeight: 700,
    fontSize: 30,
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    color: 'var(--color-text)',
  },

  foot: {
    marginTop: 0,
    marginBottom: 0,
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    color: 'var(--color-neutral-600)',
    fontSize: 13,
    lineHeight: 1.5,
  },
});
