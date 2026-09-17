/* The drill. Composition only — every rule it appears to enforce actually lives
   in appReducer, and every flag it branches on is computed in useTsumiki. */

import * as stylex from '@stylexjs/stylex';

import { SHOW_READING } from '../config';
import type { Tsumiki } from '../state/useTsumiki';
import { shared } from '../styles/shared';
import { AnswerLine } from './AnswerLine';
import { DrillActions } from './DrillActions';
import { GrammarNote } from './GrammarNote';
import { PromptBand } from './PromptBand';
import { StatusLine } from './StatusLine';
import { TileBank } from './TileBank';

export interface DrillScreenProps {
  readonly tsumiki: Tsumiki;
}

export function DrillScreen({ tsumiki }: DrillScreenProps) {
  const { state, language, item, bank, total, done, isLastItem, showNote, showReveal } = tsumiki;

  return (
    <section {...stylex.props(shared.screen)}>
      <PromptBand prompt={item.en} language={language.name} index={state.item} total={total} />

      <AnswerLine
        bank={bank}
        placed={state.placed}
        showReading={SHOW_READING}
        locked={done}
        onRemove={tsumiki.untap}
      />

      <TileBank
        bank={bank}
        placed={state.placed}
        showReading={SHOW_READING}
        locked={done}
        onPlace={tsumiki.tap}
      />

      <StatusLine status={state.status} noteOnScreen={showNote} />

      {/* `item.note` narrows for the compiler; `showNote` is already false
          without one. */}
      {showNote && item.note && <GrammarNote note={item.note} done={done} />}

      <DrillActions
        done={done}
        isLastItem={isLastItem}
        canCheck={state.placed.length > 0}
        showReveal={showReveal}
        onCheck={tsumiki.check}
        onNext={tsumiki.next}
        onReveal={tsumiki.reveal}
      />
    </section>
  );
}
