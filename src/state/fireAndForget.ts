/* Starting a write and not waiting for it.

   A store write must never sit on the path between a tap and the screen
   updating. A failed write costs a row of history; a write the exercise waited
   on would cost the exercise.

   Shared by both hooks rather than written twice: the two record different
   things, but "record it, and carry on regardless" is one rule and should fail
   the same way in both. */

export function fireAndForget(write: Promise<void>): void {
  void write.catch((error: unknown) => {
    console.warn('Tsumiki: an attempt was not recorded.', error);
  });
}
