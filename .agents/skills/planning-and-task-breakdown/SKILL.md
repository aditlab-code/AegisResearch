---
name: planning-and-task-breakdown
description: Breaks work into ordered tasks. Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel work is possible.
---

# Planning and Task Breakdown

## Overview

Decompose work into small, verifiable tasks with explicit acceptance criteria. Good task breakdown is the difference between an agent that completes work reliably and one that produces a tangled mess. Every task should be small enough to implement, test, and verify in a single focused session.

## When to Use

- You have a spec and need to break it into implementable units
- A task feels too large or vague to start
- Work needs to be parallelized across multiple agents or sessions
- You need to communicate scope to a human
- The implementation order isn't obvious

**When NOT to use:** Single-file changes with obvious scope, or when the spec already contains well-defined tasks.

## The Planning Process

### Step 1: Enter Plan Mode
Before writing any code, operate in read-only mode:
- Read the spec and relevant codebase sections.
- Identify existing patterns and conventions.
- Note risks and unknowns.
- **Do NOT write code during planning.** The output is a plan document saved to `tasks/plan.md` and a task list recorded in `tasks/todo.md`.

### Step 2: Identify the Dependency Graph via CodeGraph AST
Map what depends on what using **CodeGraph AST Tools** (orchestrated by `hermes-scout`):
- Run `codegraph_impact_analysis(symbol)` to measure the transitive blast radius.
- Run `codegraph_find_callers(symbol)` and `codegraph_find_callees(symbol)` to trace precise call hierarchies.
- Run `codegraph_find_references(symbol)` to pinpoint cross-file consumers.

```
Core Schema / Models
    │
    ├── API interfaces / Endpoints (validated via codegraph_trace_api)
    │       │
    │       └── Consumer clients & modules
    │               │
    │               └── UI / Client components
    │
    └── Validation logic
```

Always build from the bottom up: independent components first, dependents last.

### Step 3: Vertical Slicing
Prefer vertical slices (a thin slice through all layers for one capability) over horizontal layers (building the entire database layer first).

### Step 4: Write Atomic Tasks
Each task must be:
- **Small**: Touches 1–5 files, takes 1 focused iteration.
- **Verifiable**: Has a clear command or test to prove it works.
- **Independent**: Can be verified on its own before moving to the next.

**Task Format:**
```markdown
- [ ] Task [N]: [Action verb] [what] in [where]
  - Acceptance: [Explicit conditions when done]
  - Verify: [Exact test command, e.g. pytest tests/test_feature.py]
  - Files: [List of files to touch]
```

### Step 5: Save & Human Review Gate
1. Save the plan to `tasks/plan.md` and tasks to `tasks/todo.md`.
2. Present the plan and highlight key architectural trade-offs.
3. Stop and wait for user approval before moving to the implementation phase.

## Verification
- [ ] Dependency graph mapped with CodeGraph AST impact analysis
- [ ] Tasks ordered from dependencies up to consumers
- [ ] Every task includes verification criteria
- [ ] Plan saved to `tasks/plan.md` and task list in `tasks/todo.md`
- [ ] Human approval obtained before implementation begins
