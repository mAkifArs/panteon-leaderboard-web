---
name: check-case
description: Verify the frontend codebase satisfies every requirement in docs/case/case-en.html. Use before every commit to main and before final delivery. Returns a requirement-by-requirement checklist with file:line references for each implemented item.
---

# Check Case — Frontend Compliance Audit

The brief in `docs/case/case-en.html` lists explicit requirements.
This skill walks the brief end-to-end and produces a checklist
mapping each requirement to the file/line that fulfils it.

## Procedure

1. Parse `docs/case/case-en.html` — extract requirements grouped
   by section. Pay attention to anything stated **twice** in the
   brief (signal of importance).
2. For each requirement, search the codebase for the
   implementation. Use grep, semantic search, or the file
   structure. Do not guess.
3. Output a checklist:

```
[x] R1: Top-100 leaderboard view
    src/components/LeaderboardList/LeaderboardList.tsx:12

[x] R2: Own-rank cluster (3 above + self + 2 below)
    src/components/OwnRankCluster/OwnRankCluster.tsx:8
    src/lib/rankWindow.ts:4

[ ] R3: Weekly reset countdown
    NOT FOUND

[x] R4: Reusable React components
    src/components/LeaderboardRow/  (variant prop)
    src/components/RankBadge/
    src/components/OwnRankCluster/
```

4. Anything `[ ]` is a delivery blocker.

## What this skill does NOT do

- It does not run tests.
- It does not lint or typecheck.
- It does not check accessibility — `a11y-patterns` covers that.
- It does not review code quality — `/review-changes` covers that.

This skill answers exactly one question: **"have we built every
thing the brief asked for?"**

## When to invoke

- Before every commit to `main`.
- Before sending the delivery email on 4 May 09:30.
- After any major refactor that moved files.

## Output format

Markdown with `[x]` / `[ ]` checkboxes, one requirement per
line, file:line references for completed items, "NOT FOUND" for
missing items. Print to stdout.
