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

## Markdown formatting

- No forced line breaks
