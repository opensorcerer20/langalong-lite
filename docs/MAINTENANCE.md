# Maintenance

[← README](../README.md)

Known debt, the original prototype, the deploy setup, and what is most likely to confuse someone running the app for the first time.

## The original prototype

`prototype/` holds the pre-React app — one `app.js`, one `index.html` with all the CSS in a `<style>` block, and no build step. It is kept for side-by-side comparison and is not part of the build. To run it, serve the repository root and open `/prototype/`:

```
python3 -m http.server 8000
```

It shares `fonts/`, `icons/` and `_ds/` with the React app, so it must be served from the repository root rather than from inside `prototype/`.

## Deploying to GitHub Pages

[deploy.yml](../.github/workflows/deploy.yml) builds the app and publishes `dist/` on every push, from any branch. Two settings outside the repository have to agree with it, and neither is in version control — a fresh clone or a transferred repo has neither.

### 1. Pages source

**Settings → Pages → Build and deployment → Source: `GitHub Actions`**

The default, "Deploy from a branch", expects a `gh-pages` branch or a `/docs` folder. The workflow uploads an artifact instead, so with the wrong source the deploy job has nothing to publish to.

### 2. The `github-pages` environment

**Settings → Environments → `github-pages` → Deployment branches and tags: `No restriction`**

GitHub creates this environment on its own, with a policy that allows the default branch only. Deploying from any branch is deliberate here — it is what lets a branch build be installed on the phone before it reaches `main` — so the policy has to be widened by hand.

**The trap: whether that policy is enforced depends on repository visibility.**

| Repo | Plan | Branch policy |
| --- | --- | --- |
| Private | Free | Not enforced — every branch deploys |
| Public | any | Enforced |

Deployment branch policies are a paid feature on private repos. So a repo that had been deploying happily from any branch starts failing the moment it is made public, with nothing in the repository having changed:

```
Branch "maintenance-01" is not allowed to deploy to github-pages due to environment protection rules.
The deployment was rejected or didn't satisfy other protection rules.
```

The `build` job still passes — only `deploy` is rejected. The alternative fix, if the restriction is wanted, is to gate the workflow instead and give up branch previews:

```yaml
on:
  push:
    branches: [main]
```

### What the workflow already handles

- **One site, latest push wins.** `concurrency: group: pages` with `cancel-in-progress`. A branch push replaces whatever was published last, whichever branch it came from. Worth remembering while the repo is public: a branch build *is* the live public site until something supersedes it.
- **A type error blocks the deploy.** `npm run build` runs `tsc --noEmit` first.
- **The project subpath needs no configuration.** `configure-pages` injects the Pages url as `base`, and `vite.config.ts` overrides it with `./` — every url in the build is relative, which is the same constraint that lets the service worker resolve its precache list.

## Troubleshooting

**A stale service worker serves the old app.** The prototype registered a cache-first worker at the repository root; if you ever loaded it from a served origin, it may still be installed. The app now unregisters a worker that is controlling its page and is not its own, so this should heal itself on one load — see `src/pwa.ts`. Manual fix if it does not: DevTools → Application → Service Workers.

**A `tsumiki` IndexedDB database on an old install.** Anything that ran a build from before 2026-09-20 still has one, holding attempt rows. Nothing reads or writes it now. Clearing the app's site data removes it.

**Nothing you changed appears in the browser.** The app's own worker is cache-first. It only registers in a production build, so `npm run dev` is unaffected, but `npm run preview` will serve a previous build until the new one activates. DevTools → Application → Service Workers → Update on reload, or Unregister.

## The one modification to the vendored design system

`_ds/modernist-…/styles.css` is otherwise imported exactly as it was handed over. One line has been removed from it: the `@import` pulling Archivo from Google Fonts.

The app vendors Archivo itself in `src/styles/fonts.css`. Those `@font-face` rules already won the match, so nothing rendered from the imported copy — but the request fired on every load, an `@import` blocks first paint, and it was the app's only third-party network call.

**If `_ds/` is ever re-exported, the line comes back.** There is no build step over it, so nothing will catch that automatically. Check for it:

```
grep -n 'fonts.googleapis.com' _ds/modernist-*/styles.css   # expect no match
grep -o '@import[^;]*' dist/assets/*.css                    # expect no match after npm run build
```

The removal is commented in place at the top of the file, and in `src/main.tsx` and `src/styles/fonts.css`.

## Cleanup

Nothing here is broken; all of it was deferred deliberately and should not be a surprise later. Roughly in order of how likely it is to bite.

**Nothing is saved between sessions.** The score and which set you were on live only in `appReducer`, so a reload loses both. That is the current design, not an oversight — see [ROADMAP.md](ROADMAP.md) for what returning progress would take.

**Two copies of the Japanese.** `prototype/app.js` carries its own full copy of the sentences, and nothing enforces that it matches `content/ja/`. Nothing now depends on it either — the bank fixture generated from the prototype's copy is gone, so drift costs nothing but confusion for anyone reading `prototype/` as a reference. Either declare it a frozen artifact and stop treating it as one, or delete it once the React version is trusted enough.

**The Claude Design handoff.** `prototype/Sentence Builder.dc.html` and `prototype/support.js` are the original handoff — 91 KB, tracked, referenced by nothing that runs. They sat at the repository root and have since moved into `prototype/`, which is the right place for them; `prototype/DESIGN.md` supersedes them as the record of intent.

**No iOS support, on purpose.** `index.html` has no `apple-touch-icon` or `apple-mobile-web-app-*` tags, because the install target is Android. `icon-180.png` is the unreferenced `apple-touch-icon`; keep it, it is 716 bytes. On iOS today the home-screen icon would be a screenshot and the app would launch with Safari chrome. Four lines in `index.html` whenever that matters.

**Untracked `.DS_Store` files** at the repository root and in `_ds/`. Gitignored, so harmless, but still on disk.

**`vite.config.ts` keeps the StyleX dev-server hook only for `npm run dev`.** A workaround for an upstream bug, not a preference:

- `configureServer` starts a 150ms HMR poll, cleared only on an http server's `close` event.
- Vitest and `vite-node` never listen on one, so the poll never stops: test runs hung 10s on exit, and `npm run import` / `npm run font` never exited at all.
- `devMode: 'off'` does not help — the interval is guarded by `if (shared)`, and `getSharedStore()` always returns a store.

`stylexFor` keeps the hook only when `mode === 'development'`, and both scripts run with `--mode script`. Drop all of it once `@stylexjs/unplugin` clears the interval itself.

**`prototype/DESIGN.md` is stale in a confusing way.** Its "Not built yet" list includes "Real PWA plumbing: manifest, service worker, offline lesson cache" — written before the prototype existed. The prototype then built exactly that, and the React conversion dropped it again. The line is accidentally true for the wrong reason, which is worse than being plainly wrong.

**Prettier owns `content/`.** The situation files are hand-authored but formatted like code, so `npm run format` will reflow JSON you wrote by hand. Harmless — it is how the other four situation files already looked — but run it after adding content rather than being surprised by it in a later diff.

**There is no `LICENSE` file.** The two vendored fonts are licensed in the README, but the project's own code says nothing. `package.json` is `"private": true` with no `license` field.
