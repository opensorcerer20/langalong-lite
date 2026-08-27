/* Content from the compiled language packs — today's ContentSource.

   The packs are ordinary modules, so both methods resolve immediately. The
   async signature is not pretending otherwise; it belongs to the interface, not
   to this implementation, so that a store-backed source can replace this one
   without a caller learning about it.

   This is the only file in storage/ that reads data/, which keeps the registry
   import in one place on this side of the seam the same way useTsumiki keeps it
   in one place on the other. */

import { LANGUAGE, LANGUAGES } from '../data/languages';
import type { LanguagePack } from '../data/types';
import type { ContentSource } from './types';

export function createModuleContentSource(): ContentSource {
  return {
    async languages(): Promise<readonly LanguagePack[]> {
      return LANGUAGES;
    },
    async active(): Promise<LanguagePack> {
      return LANGUAGE;
    },
  };
}
