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

**A stale service worker serves the old app.** The prototype registered a cache-first service worker at the repository root. If you loaded it from a served origin, that worker is still installed and will serve the old cached shell over the new app. Unregister it in DevTools → Application → Service Workers.

**`[plugin:unplugin-stylex] context method emitFile() is not supported in serve mode`** prints on every `npm run dev` and `npm test`. It is cosmetic — the plugin falls back to runtime style injection, which is normal StyleX dev behaviour. See the StyleX pin below.

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

**Orphaned icons.** `icons/` holds four files; the React app references only `icon-192.png`, as the favicon. The 512, maskable-512 and 180 variants exist for the web manifest, which now lives in `prototype/`. Keep them — re-adding PWA support needs them — but they are not currently in use by anything you build.

**Untracked `.DS_Store` files** at the repository root and in `_ds/`. Gitignored, so harmless, but still on disk.

**StyleX is pinned to 0.18.3.** `unplugin-stylex` depends on `@stylexjs/babel-plugin: ^0.18.2`, which resolves below the current StyleX 0.19. Revisit when the plugin catches up or StyleX ships first-party Vite support. Related: the `emitFile()` warning under Troubleshooting above. It is cosmetic, but recurring warnings train you to stop reading warnings.

**`prototype/DESIGN.md` is stale in a confusing way.** Its "Not built yet" list includes "Real PWA plumbing: manifest, service worker, offline lesson cache" — written before the prototype existed. The prototype then built exactly that, and the React conversion dropped it again. The line is accidentally true for the wrong reason, which is worse than being plainly wrong.

**Prettier owns `content/`.** The situation files are hand-authored but formatted like code, so `npm run format` will reflow JSON you wrote by hand. Harmless — it is how the other four situation files already looked — but run it after adding content rather than being surprised by it in a later diff.

**There is no `LICENSE` file.** The two vendored fonts are licensed in the README, but the project's own code says nothing. `package.json` is `"private": true` with no `license` field.
