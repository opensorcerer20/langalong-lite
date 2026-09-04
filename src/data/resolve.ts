/* Turning a stored library into a drillable pack.

   One pass, at module load:

     ContentStore + DrillLanguage
        │
        ├─ 1. indexTiles      store.tiles ──► Map<TileId, Tile>
        │                     (drops scenarioIds; rejects a duplicate id)
        │
        ├─ 2. every id below is swapped for its tile via that map
        │        store.grammarTileIds        ──► pack.grammar[]
        │        scenario.vocab              ──► scenario.words[]
        │        exercise.answerTileIds      ──► item.answer[]
        │        exercise.alternate…TileIds  ──► item.alternates[][]
        │
        └─ 3. items are grouped by scenario
                 store.exercises.filter(e => e.scenarioId === scenario.id)

   Afterwards nothing downstream holds an id or performs a lookup — that is the
   whole point of doing it here.

   Every failure throws rather than degrading:

     what is wrong                        | thrown message names
     -------------------------------------|----------------------------------
     two tiles share an id                | the library and the id
     answerTileIds names a missing tile   | the exercise
     an alternate names a missing tile    | the exercise, marked "(alternate)"
     scenario.vocab names a missing tile  | the scenario
     grammarTileIds names a missing tile  | the library's grammar pool
     exercise.scenarioId has no scenario  | the exercise and the scenario

   A dangling id is a content bug with no sensible fallback: a bank missing a
   tile is a drill that cannot be completed, and a learner should never be the
   one to discover it. Throwing at load turns it into a blank screen on the
   first run after the edit, which is a far better place to find out. The
   content tests are what stop it getting that far.

   Nothing here is language-specific: it works on any ContentStore. */

import type { DrillItem, DrillLanguage, DrillPack, DrillScenario, Tile } from './drill';
import type { ContentStore, StoredExercise, StoredScenario, TileId } from './schema';

/** Index the library's tiles by id, rejecting a duplicate rather than losing one. */
function indexTiles(store: ContentStore): Map<string, Tile> {
  const index = new Map<string, Tile>();

  for (const stored of store.tiles) {
    if (index.has(stored.id)) {
      throw new Error(`Library "${store.library}": two tiles share the id "${stored.id}"`);
    }
    /* scenarioIds is dropped here: it is how the library is organised, not
       something a tile carries into the drill. */
    index.set(stored.id, {
      id: stored.id,
      newLanguageText: stored.newLanguageText,
      reading: stored.reading,
      type: stored.type,
    });
  }

  return index;
}

/**
 * Resolve `store` into a pack the drill can run on.
 *
 * @param language The facts about the language that are not content — see
 *                 DrillLanguage. Supplied separately because a store holds
 *                 situations and tiles, not scripts and fonts.
 * @throws If any id in the store names something that is not there.
 */
export function resolveLibrary(store: ContentStore, language: DrillLanguage): DrillPack {
  const tiles = indexTiles(store);

  const tileFor = (id: TileId, where: string): Tile => {
    const tile = tiles.get(id);
    if (!tile) throw new Error(`${where} refers to tile "${id}", which is not in the library`);
    return tile;
  };

  const resolveItem = (exercise: StoredExercise): DrillItem => ({
    id: exercise.id,
    promptText: exercise.promptText,
    answer: exercise.answerTileIds.map((id) => tileFor(id, `Exercise "${exercise.id}"`)),
    alternates: exercise.alternateAnswerTileIds.map((alternate) =>
      alternate.map((id) => tileFor(id, `Exercise "${exercise.id}" (alternate)`)),
    ),
    note: exercise.note,
    tags: exercise.tags,
  });

  const resolveScenario = (scenario: StoredScenario): DrillScenario => ({
    id: scenario.id,
    name: scenario.name,
    kicker: scenario.kicker,
    blurb: scenario.blurb,
    /* Store order is set order: the exercises for a situation stay in the
       sequence they were authored in, which is the order they are drilled in. */
    items: store.exercises
      .filter((exercise) => exercise.scenarioId === scenario.id)
      .map(resolveItem),
    words: scenario.vocab.map((id) => tileFor(id, `Scenario "${scenario.id}" vocabulary`)),
  });

  /* An exercise pointing at a situation that does not exist would otherwise be
     silently dropped by the filter above, taking a sentence out of the app with
     nothing to show for it. */
  const scenarioIds = new Set(store.scenarios.map((scenario) => scenario.id));
  for (const exercise of store.exercises) {
    if (!scenarioIds.has(exercise.scenarioId)) {
      throw new Error(
        `Exercise "${exercise.id}" belongs to scenario "${exercise.scenarioId}", which is not in the library`,
      );
    }
  }

  return {
    ...language,
    grammar: store.grammarTileIds.map((id) => tileFor(id, `Library "${store.library}" grammar pool`)),
    scenarios: store.scenarios.map(resolveScenario),
  };
}
