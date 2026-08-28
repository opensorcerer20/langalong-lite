/* The sentence a question's answer drops into, with a gap where the answer
   goes.

   The counterpart to AnswerLine, and separate from it because the two are
   doing opposite jobs. AnswerLine is the whole sentence, built by the learner
   out of tiles. This is a sentence the learner did not build and cannot edit,
   with one hole in it — so the surrounding words are plain text rather than
   tiles, and only the gap is interactive. Drawing the context as tiles would
   invite tapping words that do nothing.

   The gap shows an underline until something is placed, then the placed tile,
   which is tappable to take it back. */

import * as stylex from '@stylexjs/stylex';

import type { Tile as TileData } from '../data/types';
import { Tile } from './Tile';

export interface ClozeLineProps {
  /** The sentence, with `null` at each slot the learner fills. */
  readonly frame: readonly (TileData | null)[];
  /** The tiles offered. `placed` holds positions in it. */
  readonly choices: readonly TileData[];
  /** Positions in `choices` the learner has placed, in order. */
  readonly placed: readonly number[];
  readonly showReading?: boolean;
  /** The answer is settled: the placed tile stays put and stops responding. */
  readonly locked?: boolean;
  /** Called with the tile's position among the placed, not its choice index. */
  readonly onRemove: (position: number) => void;
}

export function ClozeLine({
  frame,
  choices,
  placed,
  showReading,
  locked = false,
  onRemove,
}: ClozeLineProps) {
  /* Which blank we are up to as we walk the frame. A sentence can have more
     than one — a conjugation question could blank a stem and its ending — and
     the nth blank takes the nth placed tile. */
  let blank = -1;

  return (
    <div {...stylex.props(s.line)}>
      <div {...stylex.props(s.row)}>
        {frame.map((tile, index) => {
          if (tile !== null) {
            return (
              <span key={`word-${index}`} {...stylex.props(s.word)}>
                {tile[0]}
              </span>
            );
          }

          blank += 1;
          const position = blank;
          const choiceIndex = placed[position];
          const chosen = choiceIndex === undefined ? undefined : choices[choiceIndex];

          if (!chosen) {
            return <span key={`blank-${index}`} {...stylex.props(s.gap)} data-blank />;
          }

          return (
            <Tile
              key={`blank-${index}`}
              tile={chosen}
              variant="placed"
              showReading={showReading ?? true}
              disabled={locked}
              onClick={() => onRemove(position)}
            />
          );
        })}
      </div>
    </div>
  );
}

const s = stylex.create({
  line: {
    paddingTop: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingLeft: 20,
    /* Holds two rows, so the choices below do not move when a longer sentence
       wraps or a placed tile makes it wrap. */
    minHeight: 104,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomStyle: 'solid',
    borderBottomColor: 'var(--color-divider)',
  },

  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },

  /* Context, not a control: the target face, but flat text with no rule and no
     hover, so it never reads as something to tap. */
  word: {
    fontFamily: 'var(--font-target), var(--font-body)',
    fontSize: 19,
    fontWeight: 500,
    color: 'var(--color-text)',
    /* Matches the tile's own vertical padding so the baseline does not jump
       when a tile lands in the gap beside it. */
    paddingTop: 7,
    paddingBottom: 6,
  },

  /* The gap. Sized to a short tile so the line does not resize as one lands. */
  gap: {
    display: 'block',
    width: 56,
    height: 2,
    backgroundColor: 'var(--color-accent)',
    marginTop: 24,
    marginBottom: 8,
  },
});
