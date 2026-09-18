# Maintenance

[← README](../README.md)

Known debt, the original prototype, and the two things most likely to confuse someone running the app for the first time.

## The original prototype

`prototype/` holds the pre-React app — one `app.js`, one `index.html` with all the CSS in a `<style>` block, and no build step. It is kept for side-by-side comparison and is not part of the build. To run it, serve the repository root and open `/prototype/`:

```
python3 -m http.server 8000
```

It shares `fonts/`, `icons/` and `_ds/` with the React app, so it must be served from the repository root rather than from inside `prototype/`.

## Troubleshooting

**A stale service worker serves the old app.** The prototype registered a cache-first worker at the repository root; if you ever loaded it from a served origin, it may still be installed. The app now unregisters a worker that is controlling its page and is not its own, so this should heal itself on one load — see `src/pwa.ts`. Manual fix if it does not: DevTools → Application → Service Workers.

**Nothing you changed appears in the browser.** The app's own worker is cache-first. It only registers in a production build, so `npm run dev` is unaffected, but `npm run preview` will serve a previous build until the new one activates. DevTools → Application → Service Workers → Update on reload, or Unregister.

## The one modification to the vendored design system

`_ds/modernist-…/styles.css` is otherwise imported exactly as it was handed over. One line has been removed from it: the `@import` pulling Archivo from Google Fonts.

The app vendors Archivo itself in `src/styles/fonts.css`, as a variable face covering `wght 100–900`. Those `@font-face` rules are declared after the design system and already won the match, so nothing ever rendered from the imported copy — but the request still fired on every load, and an `@import` at the top of a stylesheet blocks first paint. It was also the app's only third-party network call, which is worth being rid of before the PWA work on [ROADMAP.md](ROADMAP.md) starts.

**If `_ds/` is ever re-exported, the line comes back.** There is no build step over it, so nothing will catch that automatically. Check for it:

```
grep -n 'fonts.googleapis.com' _ds/modernist-*/styles.css   # expect no match
grep -o '@import[^;]*' dist/assets/*.css                    # expect no match after npm run build
```

The removal is commented in place at the top of the file, and in `src/main.tsx` and `src/styles/fonts.css`.

## Cleanup

Debt carried over from the conversions — the plain-JS PWA prototype to React, then CSS Modules to StyleX. None of it is broken; all of it is a thing that was deliberately deferred and should not be discovered by surprise later. Roughly in order of how likely it is to bite.

**Session state resets on reload.** The first-try score and which set you were on live only in `appReducer`, so a refresh loses both. Per-item history survives — it is in IndexedDB — but nothing reads it back into the UI yet.

The hardcoded `STREAK = 'Day 12'` that used to sit beside them is gone. It was the worst of the three because it asserted something false rather than merely forgetting something true; the header now shows nothing until there is a session row to derive a real streak from. See [ROADMAP.md](ROADMAP.md).

**A display string doing double duty as an identifier.** Resolved.

- `Scenario.kicker` was `"Set 01"`, and `App.tsx` recovered the number with `.replace('Set ', '')`.
- It is now `Scenario.lessonNum`, the bare `"01"`.
- `ScenarioRow` renders `Set {lessonNum}`; the header uses the number directly.
- The English word "Set" now lives in the component layer with the rest of the UI copy.

**Defensive fallbacks, kept deliberately.** Resolved — no longer debt.

- `revealPlacement.ts` returns index `0` for an answer tile missing from the bank.
- `checkAnswer.ts` drops a placed index the bank cannot resolve.
- Either firing would show a wrong sentence and call it the answer.
- `tests/data/languages.test.ts` now asserts neither can, over every sentence in every pack.

The guard stops a content bug crashing the drill; the test stops one reaching the drill. Throwing instead would trade the second for nothing. A fallback fails the suite as:

```
Bakery · 01 "One bread, please." — reveal put "で" where "ください" belongs
```

**Two copies of the Japanese.** `prototype/app.js` carries its own full copy of the sentences, and nothing enforces that it matches `content/ja/`. Nothing now depends on it either — the bank fixture generated from the prototype's copy is gone, so drift costs nothing but confusion for anyone reading `prototype/` as a reference. Either declare it a frozen artifact and stop treating it as one, or delete it once the React version is trusted enough.

**The Claude Design handoff.** `prototype/Sentence Builder.dc.html` and `prototype/support.js` are the original handoff — 91 KB, tracked, referenced by nothing that runs. They sat at the repository root and have since moved into `prototype/`, which is the right place for them; `prototype/DESIGN.md` supersedes them as the record of intent.

**`icon-180.png` is orphaned.** The other three are in the web manifest now. The 180 is the `apple-touch-icon`, which goes with the missing iOS meta tags below. Keep it; it is 716 bytes and is what that entry needs.

**No iOS meta tags.** `index.html` has no `apple-touch-icon` and no `apple-mobile-web-app-*`. The install target is Android, where they do nothing, so they were left out deliberately rather than missed. The consequence if that changes:

- home-screen icon becomes a screenshot of the page rather than `icon-180.png`
- launches with Safari chrome visible instead of standalone

Four lines in `index.html` whenever iOS matters.

**Untracked `.DS_Store` files** at the repository root and in `_ds/`. Gitignored, so harmless, but still on disk.

**`vite.config.ts` strips the StyleX plugin's dev-server hook under Vitest.** A workaround for an upstream bug, not a preference:

- `configureServer` starts a 150ms HMR poll, cleared on the http server's `close` event.
- Vitest boots a Vite dev server but has no http server, so the interval never clears and the run hangs 10s on exit.
- `devMode: 'off'` does not help — the interval is guarded by `if (shared)`, and `getSharedStore()` always returns a store.

Keyed on `mode === 'test'`, so `vitest --mode something-else` gets the hang back. Drop `stylexFor` once `@stylexjs/unplugin` clears the interval itself.

**`prototype/DESIGN.md` is stale in a confusing way.** Its "Not built yet" list includes "Real PWA plumbing: manifest, service worker, offline lesson cache" — written before the prototype existed. The prototype then built exactly that, and the React conversion dropped it again. The line is accidentally true for the wrong reason, which is worse than being plainly wrong.

**Prettier owns `content/`.** The situation files are hand-authored but formatted like code, so `npm run format` will reflow JSON you wrote by hand. Harmless — it is how the other four situation files already looked — but run it after adding content rather than being surprised by it in a later diff.

**There is no `LICENSE` file.** The two vendored fonts are licensed in the README, but the project's own code says nothing. `package.json` is `"private": true` with no `license` field.
