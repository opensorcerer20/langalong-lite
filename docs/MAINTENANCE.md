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

## Cleanup

Debt carried over from the conversions — the plain-JS PWA prototype to React, then CSS Modules to StyleX. None of it is broken; all of it is a thing that was deliberately deferred and should not be discovered by surprise later. Roughly in order of how likely it is to bite.

**Static chrome pretending to be real data.** `STREAK = 'Day 12'` is a hardcoded literal in `src/components/App.tsx`. Nothing is persisted between sessions, so the streak, the first-try score and which set you were on all reset on reload. The streak is the worst of these because it silently asserts something false to the learner — a real streak needs storage before the number means anything.

**A display string doing double duty as an identifier.** `App.tsx` builds the drill header with `scenario.kicker.replace('Set ', '')`, so `Set 01` becomes `01`. That works only while every kicker starts with exactly `"Set "`. Rename one and the header quietly shows the whole string instead. `kicker` is serving as both the home-screen label and the header's set number; those should be two fields on `Scenario`.

**Defensive fallbacks that hide real inconsistencies.** `revealPlacement.ts` returns index `0` for an answer tile missing from the bank, and `checkAnswer.ts` skips a placed index the bank cannot resolve. Both guard against content and bank drifting apart — which `buildBank` currently makes impossible, since it seeds the answer's own tiles first. As written, a genuine inconsistency would render a wrong sentence and call it the answer. Decide whether these should throw instead.

**Two copies of the Japanese.** `prototype/app.js` carries its own full copy of all 18 sentences. They match today — 10 and 8 on both sides — but nothing enforces it, so editing `src/data/` silently drifts the prototype. `tests/fixtures/prototype-banks.json` was generated from the prototype's copy, so drift would eventually leave the parity test checking against stale content. Either declare the prototype a frozen artifact and stop treating it as a reference, or delete it once the React version is trusted enough.

**Dead weight at the repository root.** `Sentence Builder.dc.html` and `support.js` are the original Claude Design handoff — 91 KB, tracked, referenced by nothing that runs. `DESIGN.md` supersedes them as the record of intent.

**Orphaned icons.** `icons/` holds four files; the React app references only `icon-192.png`, as the favicon. The 512, maskable-512 and 180 variants exist for the web manifest, which now lives in `prototype/`. Keep them — re-adding PWA support needs them — but they are not currently in use by anything you build.

**Untracked `.DS_Store` files** at the repository root and in `_ds/`. Gitignored, so harmless, but still on disk.

**StyleX is pinned to 0.18.3.** `unplugin-stylex` depends on `@stylexjs/babel-plugin: ^0.18.2`, which resolves below the current StyleX 0.19. Revisit when the plugin catches up or StyleX ships first-party Vite support. Related: the `emitFile()` warning under Troubleshooting above. It is cosmetic, but recurring warnings train you to stop reading warnings.

**`DESIGN.md` is stale in a confusing way.** Its "Not built yet" list includes "Real PWA plumbing: manifest, service worker, offline lesson cache" — written before the prototype existed. The prototype then built exactly that, and the React conversion dropped it again. The line is accidentally true for the wrong reason, which is worse than being plainly wrong.

**There is no `LICENSE` file.** The two vendored fonts are licensed in the README, but the project's own code says nothing. `package.json` is `"private": true` with no `license` field.
