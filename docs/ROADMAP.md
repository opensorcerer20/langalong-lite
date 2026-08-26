# Roadmap

[← README](../README.md)

Two lists at two levels of finish. **Planned** is decided work that hasn't been built. **Todo** is working notes — ideas in the order they occurred, not commitments.

## Planned

- **PWA support.** The prototype was installable and worked fully offline; the React app is not and does not. The service worker and manifest were left behind in `prototype/` during the conversion rather than being ported, to be re-added once the component tree settled. Vite hashes built filenames, so the hand-maintained precache list needs replacing with a generated one.
- The **response level** — a Japanese line is spoken in a social situation and the learner assembles a reply, ranked by politeness register rather than judged literally.
- **Persistence** — progress and the streak are not stored between sessions. The "Day 12" streak is static chrome.
- **Notifications** and the daily reminder.
- **Audio** playback of prompts, and a kana keyboard fallback.

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
