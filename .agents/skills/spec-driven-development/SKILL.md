---
name: spec-driven-development
description: Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when drafting a PRD or requirements document with objectives and scope, or when requirements are unclear, ambiguous, or only exist as a vague idea.
---

# Spec-Driven Development

## Overview

Write a structured specification before writing any code. The spec is the shared source of truth between you and the human engineer — it defines what we're building, why, and how we'll know it's done. Code without a spec is guessing.

## When to Use

- Starting a new project or feature
- Requirements are ambiguous or incomplete
- The change touches multiple files or modules
- You're about to make an architectural decision
- The task would take more than 30 minutes to implement

**When NOT to use:** Single-line fixes, typo corrections, or changes where requirements are unambiguous and self-contained.

## The Gated Workflow

Spec-driven development has four phases, preceded by a scope check (Phase 0) that activates only when one request bundles several independently testable capabilities. Do not advance to the next phase until the current one is validated.

```
SPECIFY ──→ PLAN ──→ TASKS ──→ IMPLEMENT
   │          │        │          │
   ▼          ▼        ▼          ▼
 Human      Human    Human      Human
 reviews    reviews  reviews    reviews
```

### Phase 1: Specify

Write a structured specification covering all six core areas:
1. **Objective** — What we are building and why. Include user stories and testable acceptance criteria.
2. **Commands** — Real, executable commands for build, test, lint, and run.
3. **Project Structure** — Directory layout and component placement.
4. **Code Style** — Real code snippets demonstrating pattern conventions.
5. **Testing Strategy** — Frameworks, test level (unit/integration/E2E), and coverage goals.
6. **Boundaries** (Three-tier system):
   - **Always do:** Run tests before completion, follow naming conventions, validate inputs.
   - **Ask first:** Database schema changes, adding dependencies, modifying CI configuration.
   - **Never do:** Commit secrets, edit vendor directories, remove failing tests without approval.

**Spec template:**
```markdown
# Spec: [Project/Feature Name]

## Objective
[What we're building and why. User stories or acceptance criteria.]

## Tech Stack
[Framework, language, key dependencies with versions]

## Commands
[Build, test, lint, dev — full commands]

## Project Structure
[Directory layout with descriptions]

## Code Style
[Example snippet + key conventions]

## Testing Strategy
[Framework, test locations, coverage requirements, test levels]

## Boundaries
- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria
[How we'll know this is done — specific, testable conditions]

## Open Questions
[Anything unresolved that needs human input]
```

**Stop after writing the spec (CRITICAL):**
1. Summarize it and list any Open Questions.
2. Ask the human to approve it or request changes.
3. **STOP YOUR TURN IMMEDIATELY.** Planning starts only after the human approves the spec.

### Phase 2: Plan
Follow `planning-and-task-breakdown` to map dependency graphs and analyze CodeGraph AST impact. Save to `tasks/plan.md`.

### Phase 3: Tasks
Break down into atomic tasks saved to `tasks/todo.md`.
```markdown
- [ ] Task: [Description]
  - Acceptance: [What must be true when done]
  - Verify: [How to confirm — test command, build, manual check]
  - Files: [Which files will be touched]
```

### Phase 4: Implement
Execute tasks one at a time via `incremental-implementation` and `test-driven-development`.

## Verification
- [ ] The spec covers all six core areas
- [ ] The human has reviewed and approved the spec
- [ ] The turn ended after saving the spec; approval came in a later turn
- [ ] Success criteria are specific and testable
- [ ] Boundaries (Always / Ask first / Never) are defined
