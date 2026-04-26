# Timing — Frontend

The full delivery strategy lives in the API repo's `TIMING.md`.
Both repos ship together at **Monday, 4 May 2026, 09:30 local time.**

## Frontend slice of the schedule

| Date         | Day | Hours | Focus                                          |
|--------------|-----|-------|------------------------------------------------|
| 24 Apr (Thu) | 0   | 1     | Frontend structure, ADRs, skills (this file)   |
| 28 Apr (Tue) | 4   | 3     | Vite + TS + Tailwind scaffold, primitives      |
| 29 Apr (Wed) | 5   | 3     | LeaderboardList, OwnRankCluster, polling hook  |
| 30 Apr (Thu) | 6   | 3     | Responsive polish, mobile sticky verification  |
| 1 May  (Fri) | 7   | 1     | Vercel deploy + smoke test against staging API |
| 2 May  (Sat) | 8   | 1     | a11y pass, README screenshots                  |
| 3 May  (Sun) | 9   | 1     | Final bug hunt, e2e against prod API           |

~13 hours within the 33-hour total budget. Backend is the heavier
side because of the three-database orchestration; frontend is
deliberately scoped tighter.

The Discussion → Decision → Integration sequence applies on every
slot. If a slot's plan was based on a wrong assumption, we reopen
Discussion before continuing — not push through.
