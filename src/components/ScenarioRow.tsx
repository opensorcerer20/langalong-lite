/* One situation on the home screen: a full-width row, ruled off from the next.

   The row was a single button while a situation was a single thing to open. It
   is four things now, so it is a container: the heading block is still the
   button that opens the sentence drill — tapping the row does what it always
   did — and the other exercises sit under it as chips. A button cannot contain
   another button, which is why the structure changed even though the look did
   not.

   Jumping straight to one exercise is a feature, not scaffolding for the
   scenario flow to replace later. */

import * as stylex from '@stylexjs/stylex';

import type { Scenario } from '../data/types';
import type { ExerciseMode } from '../lib/progress';

/**
 * The exercises offered under a situation, in the order they are shown.
 *
 * `sentence` is not here: it is the heading block above. Phases adding an
 * exercise add a line here and nothing else in this file.
 */
const MODES: readonly { readonly mode: ExerciseMode; readonly label: string }[] = [
  { mode: 'vocab', label: 'Vocabulary' },
];

export interface ScenarioRowProps {
  readonly scenario: Scenario;
  readonly onOpen: (mode: ExerciseMode) => void;
}

export function ScenarioRow({ scenario, onOpen }: ScenarioRowProps) {
  const count = scenario.items.length;

  return (
    <div {...stylex.props(s.row)}>
      <button
        type="button"
        {...stylex.props(s.main)}
        /* Without this the accessible name is the whole block read out — set
           number, sentence count, name and blurb — which says what the row
           contains rather than what tapping it does. */
        aria-label={`${scenario.name} — build sentences`}
        onClick={() => onOpen('sentence')}
      >
        <span {...stylex.props(s.top)}>
          <span {...stylex.props(s.kicker)}>{scenario.kicker}</span>
          <span {...stylex.props(s.count)}>
            {count} {count === 1 ? 'sentence' : 'sentences'}
          </span>
        </span>
        <span {...stylex.props(s.name)}>{scenario.name}</span>
        <span {...stylex.props(s.blurb)}>{scenario.blurb}</span>
      </button>

      <div {...stylex.props(s.modes)}>
        {MODES.map(({ mode, label }) => (
          <button
            key={mode}
            type="button"
            {...stylex.props(s.chip)}
            /* Every situation offers the same exercises, so the label alone
               names several buttons on the page. The situation disambiguates
               them for anyone navigating by name. */
            aria-label={`${label} — ${scenario.name}`}
            onClick={() => onOpen(mode)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

const s = stylex.create({
  /* The rule between situations now belongs to the container rather than to the
     button, so the chips sit inside it. */
  row: {
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
    paddingBottom: 16,
  },

  main: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    backgroundColor: { default: 'transparent', ':hover': 'var(--color-accent-100)' },
    borderWidth: 0,
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 12,
    paddingLeft: 20,
    cursor: 'pointer',
    fontFamily: 'var(--font-body)',
  },

  top: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },

  kicker: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-accent-700)',
    fontWeight: 600,
  },

  count: {
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--color-neutral-600)',
  },

  name: {
    display: 'block',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: 23,
    lineHeight: 1.2,
    color: 'var(--color-text)',
    marginBottom: 6,
  },

  blurb: {
    display: 'block',
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--color-neutral-700)',
  },

  modes: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    paddingRight: 20,
    paddingLeft: 20,
  },

  /* Secondary to the row above it: the sentence drill stays the main way in,
     and these are the shortcuts past it. */
  chip: {
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    letterSpacing: '0.06em',
    fontWeight: 600,
    textTransform: 'uppercase',
    paddingTop: 6,
    paddingRight: 10,
    paddingBottom: 6,
    paddingLeft: 10,
    cursor: 'pointer',
    backgroundColor: { default: 'var(--color-surface)', ':hover': 'var(--color-accent-100)' },
    color: { default: 'var(--color-neutral-700)', ':hover': 'var(--color-accent-700)' },
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: { default: 'var(--color-divider)', ':hover': 'var(--color-accent)' },
  },
});
