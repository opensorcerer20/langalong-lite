# CLAUDE.md

Guidance for Claude Code when working in this repository. I'm a solo developer.
My biggest risk isn't writing code — it's approving code I don't actually understand.
Optimize for reviewing small changes over speed.

## Workflow: Plan → Small Steps → Review Gate

### 1. Always plan before implementing
For any nontrivial feature or fix, first produce a step-by-step roadmap as a
numbered list before writing code. Each step should be small enough that its
diff could be fully explained to another developer in under a few minutes —
roughly under 150 lines changed, touching as few files as reasonably possible.

If a step looks like it will produce more than that, split it further before
starting. Don't silently absorb a "step" that's actually three steps.

Do not start implementing until I've approved the roadmap, unless I've
explicitly said to proceed without a checkpoint.

### 2. Implement one step at a time
- Work on exactly one roadmap step per turn. Do not chain ahead into the next
  step even if the path forward seems obvious.
- Stop after the step is complete and hand control back to me. Don't keep
  going "while you're at it."
- If mid-step you discover the step was bigger than expected, stop, tell me,
  and propose splitting it rather than pushing through.

### 3. Make review easy, every time
After each step, always provide:
- **What changed and why** — a few sentences, plain language, tied back to
  the roadmap step.
- **A self-check explanation** — briefly explain the logic of any nontrivial
  code as if to someone reading it for the first time with no implementation
  context. If you can't explain it cleanly, that's a signal to reconsider the
  approach before I even review it.
- **What you'd want a reviewer to focus on** — call out the 1–3 riskiest or
  least-obvious parts of the diff (edge cases, security-sensitive code,
  assumptions you made). Don't make me hunt for what matters.
- **Tests/checks run** — confirm what was run (tests, linter, type checker)
  and the result, before I look at anything.

### 4. Never bundle unrelated changes
Refactors, formatting changes, and dependency bumps go in their own step, separate from behavioral changes — even if it's tempting to fix something adjacent while you're already in the file.

### 5. Match my codebase, don't invent patterns
Follow existing conventions, naming, and architecture already in this repo. If none exist for a given case, ask rather than picking a pattern from training data that may not fit.

### 6. Zoom out periodically
Every few completed steps, or when a feature roadmap finishes, give a short summary of how the pieces fit together as a whole system — not just a recap of individual diffs. Flag if anything drifted from the original plan or if the accumulated pieces don't cohere as cleanly as intended.

## Defaults
- Prefer paraphrased, plain-language explanations over code-only responses.
- Prefer fewer, well-explained changes over comprehensive-but-unreviewable ones.
- When uncertain about scope, ask rather than assuming the larger interpretation.

## Project structure
- `src/` — implementation code
- `tests/` — one test file per component
- `prototype/` - holds original prototype for app, no further changes desired here

## Action scope
Do not assume any scope outside the scope from the user prompt; if action may be needed outside the scope given, confirm with the user first.

## Commit style
Please don't stage or commit anything yourself — I'll do that after reviewing.

## When you're unsure
If a request is ambiguous, or implementing it would require acting in conflict with CLAUDE.md or touching a file outside the stated scope, ask me first rather than guessing.

## Markdown formatting
- No forced line breaks

## Code comments

Keep comments short. Prefer one line over a paragraph, and a diagram or a type signature over either.

Comment the non-obvious: why a value is load-bearing, a constraint that isn't visible locally, a decision that looks arbitrary but isn't. Don't restate what the code says, don't re-explain something already covered elsewhere in the file, and don't narrate history the git log already holds.

File-header comments: a few lines on what the file is for and how it connects to its neighbours. Not an essay.

This takes precedence over "Match my codebase" above. Several existing files open with long prose blocks; that's the old style, and new or edited code should be terser rather than matching it.

## Explaining data structures & relationships

Prose descriptions of how data fits together (nested objects, relationships between
entities, data flow) don't work well for me. When explaining these, prefer:

- **Diagrams**: ASCII art, tree structures, or Mermaid diagrams for relationships/hierarchies
- **Pseudocode or code snippets**: actual shape of the data (e.g. a sample JSON object,
  a struct/interface definition, a small code example) instead of describing it in words
- **Tables**: for comparing fields/types across entities

Avoid: "The user object contains an array of orders, each of which has a nested
shipping address and a list of line items that reference product IDs..."

Prefer:
```
User
 ├─ orders[]
 │   ├─ shippingAddress
 │   └─ lineItems[] → productId
```
or an equivalent JSON/type example.

This applies to explanations of schemas, API responses, state shape, config structure,
component props, etc. — anywhere data relationships are being described.

When in doubt, default to a code/diagram representation even for simple structures.
