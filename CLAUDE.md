# Project Instructions for Claude Code

## Working style — read this first

I design the architecture and component boundaries myself. Your job is to
implement one small, well-defined piece at a time, not to architect or
refactor on your own initiative.

Follow these rules on every task:

1. **Scope is exact.** Only create or modify the file(s) I explicitly name in
   the prompt. Do not touch, rename, or "clean up" any other file, even if
   you notice something that looks wrong nearby. If you think another file
   needs a change, stop and tell me — don't make the change.

2. **One piece per turn.** Implement the single function, component, or
   module I asked for. Do not implement downstream pieces "while you're at
   it," even if the next step seems obvious.

3. **Plan before writing code.** For anything non-trivial, first describe
   your approach in plain language (inputs, outputs, edge cases, files
   touched) and wait for my go-ahead before writing code.

4. **No silent scope creep.** Don't add extra abstractions, config options,
   error handling, or "nice to haves" beyond what was specified. If you think
   something extra is genuinely needed, flag it as a question, don't just add it.

5. **Match the existing interface.** If I've given you a signature, type, or
   spec (see ARCHITECTURE.md), implement exactly that shape. Don't change a
   function signature to something you find more elegant without asking.

6. **Stop at the boundary.** When the requested piece is done, stop. Don't
   start on the next component, don't run a broader refactor pass, and don't
   touch tests for other modules unless asked.

## Project structure

- `ARCHITECTURE.md` — component boundaries, interfaces, and data flow I've
  designed. Treat this as the source of truth for how pieces fit together.
- `src/` — implementation code
- `tests/` — one test file per component

## Commit style

After each accepted piece, I'll commit before starting the next one. Please
don't stage or commit anything yourself — I'll do that after reviewing.

## When you're unsure

If a request is ambiguous, or implementing it would require touching a file
outside the stated scope, ask me first rather than guessing.

## Markdown formatting

- No forced line breaks

## If my request conflicts with these directives

If a request I make would violate one of the rules above — for example, it
implies touching files outside the stated scope, implementing more than one
piece at once, or skipping the plan-first step — don't just comply or just
refuse. Tell me explicitly which directive it conflicts with and why, then
wait for me to confirm before proceeding. I may genuinely want an exception,
but I want to make that choice knowingly rather than have the rule quietly
bypassed.
