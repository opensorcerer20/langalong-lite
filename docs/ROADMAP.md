# Roadmap

[← README](../README.md)

Two lists at two levels of finish. **Planned** is decided work that hasn't been built. **Todo** is working notes — ideas in the order they occurred, not commitments.

## Planned

- **PWA support.** The prototype was installable and worked fully offline; the React app is not and does not. The service worker and manifest were left behind in `prototype/` during the conversion rather than being ported, to be re-added once the component tree settled. Vite hashes built filenames, so the hand-maintained precache list needs replacing with a generated one.
- The **response level** — a Japanese line is spoken in a social situation and the learner assembles a reply, ranked by politeness register rather than judged literally.
- **Persistence** — progress and the streak are not stored between sessions. The "Day 12" streak is static chrome.
- **Notifications** and the daily reminder.
- **Audio** playback of prompts, and a kana keyboard fallback.
- **A second language.** The content is already isolated behind a `LanguagePack` and the app reads one active pack, so a new language is a folder plus a registry entry — see [AUTHORING.md](AUTHORING.md#adding-a-language). What is still missing is everything around it: an in-app picker, progress and streak stored per language rather than globally, and a font subset per pack. Grammar itself is the open question — the drill teaches word order and particles, which suits Japanese; a language whose difficulty sits in conjugation or agreement may want a different exercise rather than the same one with different tiles.

## Todo

Rough notes. Several of these need per-item history, which does not exist yet — see "What this flow assumes" in [FLOW.md](FLOW.md).

- Osusume wa nan desu ka?: add alts, and add the note "this is the more natural phrasing as opposed to 'nani ga osusume desu ka'".
- For answers with alternates, give a chance to get the best answer.
- Clicking a tile that was placed removes only that tile, and the next tile clicked goes in that spot.
- A rough sequence for learning (ask for Claude feedback):
  - learn vocabulary
  - learn how to use particles
  - learn verb conjugation
  - learn sentences
- User can jump around as desired.
- Star system:
  - one star: finished with zero incorrect
  - two stars: finished with zero misses
  - three stars: finished all sections with zero misses
- Vocabulary before building sentences.
- Basic particle learning.
- Verb conjugation learning.
