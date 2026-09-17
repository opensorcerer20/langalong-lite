/* One situation on the home screen: a full-width row, ruled off from the next. */

import * as stylex from '@stylexjs/stylex';

import type { Scenario } from '../data/types';

export interface ScenarioRowProps {
  readonly scenario: Scenario;
  readonly onOpen: () => void;
}

export function ScenarioRow({ scenario, onOpen }: ScenarioRowProps) {
  const count = scenario.items.length;

  return (
    <button type="button" {...stylex.props(s.row)} onClick={onOpen}>
      <div {...stylex.props(s.top)}>
        <span {...stylex.props(s.kicker)}>Set {scenario.lessonNum}</span>
        <span {...stylex.props(s.count)}>
          {count} {count === 1 ? 'sentence' : 'sentences'}
        </span>
      </div>
      <div {...stylex.props(s.name)}>{scenario.name}</div>
      <div {...stylex.props(s.blurb)}>{scenario.blurb}</div>
    </button>
  );
}

const s = stylex.create({
  row: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    backgroundColor: { default: 'transparent', ':hover': 'var(--color-accent-100)' },
    borderWidth: 0,
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
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
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    fontSize: 23,
    lineHeight: 1.2,
    color: 'var(--color-text)',
    marginBottom: 6,
  },

  blurb: {
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--color-neutral-700)',
  },
});
