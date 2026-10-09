---
name: code-review-and-quality
description: Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enters the main branch. Use when asked to review a diff or a pull request.
---

# Code Review and Quality

## Overview

Multi-dimensional code review with quality gates. Every change gets reviewed before merge — no exceptions. Review covers five axes: correctness, readability, architecture, security, and performance.

**The approval standard:** Approve a change when it definitely improves overall code health, even if it isn't perfect. Perfect code doesn't exist — the goal is continuous improvement.

## When to Use

- Before merging any PR or change
- After completing a feature implementation
- When evaluating changes produced during `/build`
- When refactoring existing code
- After any bug fix (review both the fix and the regression test)

## The Five-Axis Review

### 1. Correctness
- Does the change match the spec/acceptance criteria?
- Are edge cases (null, empty, boundary values) handled?
- Are error paths and fallbacks verified?
- Do tests pass and accurately assert behavior?

### 2. Readability & Simplicity
- Can another engineer understand the code without explanation?
- Are names descriptive and consistent?
- Is control flow flat and straightforward?
- Are abstractions earning their complexity (YAGNI)?

### 3. Architecture & Zero-Orphan Gate
- Are module boundaries maintained?
- Are there circular dependencies?
- **Zero-Orphan Verification**: Run `codegraph_find_orphans` to confirm that no dead, unreferenced, or orphaned symbols were left behind.

### 4. Security
- Is input validated and sanitized at system boundaries?
- Are secrets kept out of version control and logs?
- Are permissions, authentication, and authorization verified?

### 5. Performance
- Any N+1 queries or unconstrained loops?
- Any unnecessary synchronous I/O or blocking operations?
- Any memory leaks or unbounded caching?

## Findings & Verdict Format

Group findings by severity:
- `[BLOCKER]` Must fix before merge (broken contracts, security issues, test failures)
- `[WARNING]` Should fix, but not blocking (minor architectural drift)
- `[SUGGESTION]` Nice to have (simplification, naming)
- `[PRAISE]` Call out elegant solutions

### Overall Verdict
- **APPROVE**: Ready to merge as-is.
- **REQUEST_CHANGES**: Blockers must be addressed.
- **COMMENT**: Advisory feedback.
