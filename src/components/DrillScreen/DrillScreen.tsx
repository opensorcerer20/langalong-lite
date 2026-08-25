/* The drill. Composition only — every rule it appears to enforce actually lives
   in appReducer, and every flag it branches on is computed in useTsumiki. */

import { NOTE_AFTER_MISSES, SHOW_ROMAJI } from '../../config';
import type { Tsumiki } from '../../state/useTsumiki';
import { AnswerLine } from '../AnswerLine/AnswerLine';
import { DrillActions } from '../DrillActions/DrillActions';
import { GrammarNote } from '../GrammarNote/GrammarNote';
import { PromptBand } from '../PromptBand/PromptBand';
import { StatusLine } from '../StatusLine/StatusLine';
import { TileBank } from '../TileBank/TileBank';

export interface DrillScreenProps {
  readonly tsumiki: Tsumiki;
}

export function DrillScreen({ tsumiki }: DrillScreenProps) {
  const { state, item, bank, total, done, isLastItem, showNote, showReveal } = tsumiki;

  return (
    <section className="screen">
      <PromptBand prompt={item.en} index={state.item} total={total} />

      <AnswerLine
        bank={bank}
        placed={state.placed}
        length={item.ans.length}
        showRomaji={SHOW_ROMAJI}
        locked={done}
        onRemove={tsumiki.untap}
      />

      <TileBank
        bank={bank}
        placed={state.placed}
        showRomaji={SHOW_ROMAJI}
        locked={done}
        onPlace={tsumiki.tap}
      />

      <StatusLine
        status={state.status}
        misses={state.misses}
        noteAfterMisses={NOTE_AFTER_MISSES}
      />

      {showNote && <GrammarNote note={item.note} done={done} />}

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
