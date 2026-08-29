# Project Instructions for Claude Code

## Project structure

- `src/` — implementation code
- `tests/` — one test file per component
- `prototype/` - holds original prototype for app, no further changes desired here

## Action scope

Do not assume any scope outside the scope from the user prompt; if action may be needed outside the scope given, confirm with the user first.

If user asks for an answer to a question, do not assume that is a call to action unless the question is phrased as "can you do..." or "would you do..." or something similar; answer the question and then offer to make changes, but do not make those changes automatically.

## Commit style

Please don't stage or commit anything yourself — I'll do that after reviewing.

## When you're unsure

If a request is ambiguous, or implementing it would require acting in conflict with CLAUDE.md or touching a file outside the stated scope, ask me first rather than guessing.

If you plan to act against a user request, state your reason and get confirmation before proceeding.

## Markdown formatting

- No forced line breaks

## Directives specific to Tsumiki / Langalong Lite

**The goal.** This app exists so I can learn to assemble Japanese sentences
*instinctually* — the way I would need to think of a sentence a moment before
saying it in Japan. Not "can work out the right answer given time." My weak
points, in order: particle usage first, verb conjugation second. See
[docs/PLAN.md](docs/PLAN.md).

**Tell me when I drift.** If something serves the goal poorly, say so in a
sentence or two before building it — including when the request is mine and
stated confidently, and including things you proposed yourself. Then follow my
instruction: raise it once, and if I reaffirm, build it without relitigating.

This is about direction, not scope. Tests, refactors, tooling and documentation
support the goal indirectly and are not drift. A new exercise, feature or
content shape that does not make sentence production more instinctive is.
