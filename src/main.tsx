/* Entry point.

   Stylesheet order matters and is the same order the prototype used:

     1. the design system — every color, space and type token, plus .btn and
        .hr. Vendored, and modified in exactly one place: its Google Fonts
        @import was removed, because the faces below replace it;
     2. the vendored faces, which are what every glyph is drawn from, so the
        app renders correctly with no network and makes no third-party request;
     3. the app's own global rules, which build on the tokens above.

   Everything else is a CSS module, imported by the component that owns it. */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '../_ds/modernist-47face9e-49d1-431f-a4b3-bbfe4229952e/styles.css';
import './styles/fonts.css';
import './styles/global.css';

import { App } from './components/App';
import { registerServiceWorker } from './pwa';
import { openRepository } from './storage';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

/* Storage and content are resolved once, here, before anything renders.

   ContentSource is asynchronous so that a store-backed one can replace the
   module-backed one later. Resolving it at the entry point rather than inside
   the tree means that swap costs nothing downstream: App and useTsumiki still
   receive a pack that is simply there, and no component learns to wait.

   Written as a chain rather than with top-level await so the bundle does not
   depend on the build target supporting it.

   Opening storage cannot fail in a way that stops the app — openRepository
   falls back to keeping progress in memory — so there is no error branch. What
   it can do is fail to be durable, and `durable` is carried through to the
   header rather than dropped: a session that will be forgotten says so. */
void openRepository().then(async (repository) => {
  const language = await repository.content.active();

  createRoot(root).render(
    <StrictMode>
      <App language={language} progress={repository.progress} durable={repository.durable} />
    </StrictMode>,
  );

  /* After the render, never before. The worker is for the next visit, and
     precaching the bundle must not compete with drawing this one. */
  registerServiceWorker();
});
