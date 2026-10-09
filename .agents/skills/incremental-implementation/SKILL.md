---
name: incremental-implementation
description: Delivers changes incrementally in thin, verifiable slices. Use when implementing any feature or change that touches more than one file, or when picking up the next task from a plan. Use when rolling a change out behind a feature flag, when you're about to write a large amount of code at once, or when a task feels too big to land in one step.
---

# Incremental Implementation

## Overview

Build in thin vertical slices — implement one piece, test it, verify it, then expand. Avoid implementing an entire feature in one pass. Each increment should leave the system in a working, testable state. This is the execution discipline that makes large features manageable.

## When to Use

- Implementing any multi-file change
- Building a new feature from a task breakdown
- Refactoring existing code
- Any time you're tempted to write more than ~100 lines before testing

**When NOT to use:** Single-file, single-function changes where the scope is already minimal.

## The Increment Cycle

```
┌──────────────────────────────────────┐
│                                      │
│   Implement ──→ Test ──→ Verify ──┐  │
│       ▲                           │  │
│       └───── Commit ◄─────────────┘  │
│              │                       │
│              ▼                       │
│          Next slice                  │
│                                      │
└──────────────────────────────────────┘
```

For each slice:
1. **Implement** the smallest complete piece of functionality (surgical edit).
2. **Test** — run the test suite immediately.
3. **Verify** — confirm the slice works as expected (tests pass, build succeeds).
4. **Checkpoint / Commit** — preserve progress with an atomic commit.
5. **Move to the next slice** — carry forward without breaking previously working code.

## Slicing Strategies

- **Vertical over Horizontal**: Build a thin slice through all layers (e.g., model -> endpoint -> UI) rather than building all models, then all endpoints.
- **Inside-Out**: Build pure business logic and unit tests first, then wire external dependencies and I/O.
- **Outside-In**: Build the API contract or caller interface first, then fill in internal implementation details.

## Rules
- Never leave the test suite broken between increments.
- Keep each edit bounded (< 100 lines per turn).
- Run automated tests after every modification.
