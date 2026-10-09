---
name: test-driven-development
description: Drives development with tests using the red-green-refactor loop. Use when implementing any logic, fixing any bug, or changing any behavior. Use when you need to prove that code works, when a bug report arrives, or when you're about to modify existing functionality.
---

# Test-Driven Development

## Overview

Write a failing test before writing the code that makes it pass. For bug fixes, reproduce the bug with a test before attempting a fix. Tests are proof — "seems right" is not done. A codebase with good tests is an AI agent's superpower; a codebase without tests is a liability.

## When to Use

- Implementing any new logic or behavior
- Fixing any bug (the Prove-It Pattern)
- Modifying existing functionality
- Adding edge case handling
- Any change that could break existing behavior

**When NOT to use:** Pure configuration changes, documentation updates, or static content changes that have no behavioral impact.

## The TDD Cycle

```
    RED                GREEN              REFACTOR
 Write a test    Write minimal code    Clean up the
 that fails  ──→  to make it pass  ──→  implementation  ──→  (repeat)
```

### 1. RED — Write a Failing Test First
- Write a focused test expressing the expected behavior.
- Run the test and confirm it FAILS for the expected reason (not due to a syntax/import error).

### 2. GREEN — Make It Pass
- Write the minimal code necessary to make the test pass.
- Resist the urge to write more code than the test requires.
- Run the test and verify it passes.

### 3. REFACTOR — Clean It Up
- Clean up duplication, improve readability, adhere to conventions.
- Keep the test suite passing throughout the refactor.

### 4. Prove-It Pattern for Bugs
- Never touch implementation code for a bug fix without first writing a test that demonstrates the failure.
- If the test doesn't fail on existing code, you have not reproduced the bug.

## Rules
- Every test name should describe behavior in plain language (`it('returns 404 when user id is invalid')`).
- Keep tests isolated: no shared mutable global state.
- Test edge cases: empty inputs, boundary values, error exceptions.
