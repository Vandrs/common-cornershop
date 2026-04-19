# Contributing

## Roadmap ↔ Board Sync Policy

### Canonical source

- **Source of truth:** GitHub Project board (status, owner, priority, blockers, due date).
- **Roadmap (`docs/roadmap.md`):** planning and communication snapshot; never overrides board state.

### SLA

- Any change in board state that impacts roadmap visibility must be reflected in `docs/roadmap.md` within **24h**.

### Objective triggers (update roadmap within 24h)

- Card moved across workflow columns (e.g., Backlog → In Progress → Done).
- Priority changed.
- Scope changed (task split/merge/redefined).
- New blocker or dependency added/removed.
- Milestone/phase target changed.
- Issue/PR link changed for roadmap-critical items.

### Responsibilities

- **Author (PR owner):** updates board first; updates roadmap when trigger applies.
- **Reviewer:** verifies board↔roadmap consistency in PR checklist.
- **Maintainer:** resolves conflicts and approves final canonical alignment.

### PR checklist (short)

- [ ] Board updated first (canonical state).
- [ ] If trigger applied, roadmap updated in the same PR (or linked follow-up PR within 24h).
- [ ] Reviewer validated board ↔ roadmap consistency.

### Operational sync protocol (minimum)

- On implementation start: board -> In Progress; issue remains open.
- On PR open: board -> Review; issue remains open.
- On PR merge: close issue + board -> Done; update roadmap status to ✅ Concluída in a docs branch.

#### Hard guards

- Do not close issues before merge.
- Do not mark Done while PR is open.
- If roadmap/board diverge, board wins and roadmap must be synced within SLA.

Execution details: docs/agent-runbook.md
