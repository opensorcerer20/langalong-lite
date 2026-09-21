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
import { LANGUAGE } from './data/languages';
import { registerServiceWorker } from './pwa';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App language={LANGUAGE} />
  </StrictMode>,
);

/* After the render, never before. The worker is for the next visit, and
   precaching the bundle must not compete with drawing this one. */
registerServiceWorker();
