---
name: code-simplification
description: Simplifies code for clarity. Use when refactoring code for clarity without changing behavior. Use when code works but is harder to read, maintain, or extend than it should be. Use when reviewing code that has accumulated unnecessary complexity.
---

# Code Simplification

## Overview

Simplify code by reducing complexity while preserving exact behavior. The goal is not fewer lines — it's code that is easier to read, understand, modify, and debug. Every simplification must pass a simple test: "Would a new team member understand this faster than the original?"

## When to Use

- After a feature is working and tests pass, but the implementation feels heavier than it needs to be
- During code review when readability or complexity issues are flagged
- When you encounter deeply nested logic, long functions, or unclear names
- When refactoring code written under time pressure
- When consolidating related logic scattered across files

**When NOT to use:**
- Code is already clean and readable
- You don't understand what the code does yet
- The code is performance-critical and the simpler version would be measurably slower

## The Five Principles

1. **Preserve Behavior Exactly**: All inputs, outputs, side effects, error behavior, and edge cases must remain identical. All existing tests must pass without modification.
2. **Follow Project Conventions**: Match the existing architectural style and idiom of the repository.
3. **Clarity Over Cleverness**: Explicit, linear control flow beats terse, dense one-liners.
4. **Reduce Indentation & Nesting**: Invert `if` conditions to return early (guard clauses) and flatten nested callbacks.
5. **Delete Dead Code**: Eliminate unused variables, dead functions, commented-out blocks, and speculative abstractions.

## Verification
- [ ] Behavior is 100% identical
- [ ] All unit and regression tests pass without change
- [ ] Code is demonstrably clearer and less nested
- [ ] Zero orphan code or dead symbols left behind
