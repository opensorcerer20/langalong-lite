/* The two rules used by more than one component.

   Everything else lives in the component that owns it. These two do not belong
   to any single one — `screen` is the layout every screen shares, and `kicker`
   is the small uppercase label that appears above a heading in three places —
   so they are defined once here and composed like any other style:

     <section {...stylex.props(shared.screen)}>

   The design system's own `.btn` and `.hr` stay plain global classes on
   className; they are not StyleX and do not need to be. */

import * as stylex from '@stylexjs/stylex';

export const shared = stylex.create({
  /* One screen fills the column below the header and progress rule.

     `minHeight: 0` because a flex child otherwise refuses to shrink below its
     content, and nothing inside it could ever scroll. */
  screen: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },

  /* The small uppercase label above a heading. */
  kicker: {
    fontSize: 11,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--color-neutral-600)',
    marginBottom: 10,
  },

  /* The done screen's kicker sits directly above the score, with no gap. */
  kickerTight: {
    marginBottom: 0,
  },
});
