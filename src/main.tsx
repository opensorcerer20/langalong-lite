/* Entry point.

   Stylesheet order matters and is the same order the prototype used:

     1. the design system, unmodified — every color, space and type token, plus
        .btn and .hr. It @imports Archivo from Google Fonts;
     2. the vendored faces, which are declared second and so win the match,
        making the app render correctly with no network;
     3. the app's own global rules, which build on the tokens above.

   Everything else is a CSS module, imported by the component that owns it. */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '../_ds/modernist-47face9e-49d1-431f-a4b3-bbfe4229952e/styles.css';
import './styles/fonts.css';
import './styles/global.css';

import { App } from './components/App/App';

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
