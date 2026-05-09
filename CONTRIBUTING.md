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

## Branch & Commit Policy (Mandatory)

To keep the repository and board workflow safe and auditable the following rules are mandatory for all contributors and automated agents interacting with this repo:

- Never commit directly on `main` by default. All changes (code, docs, roadmap edits) must be implemented on a branch and submitted through a Pull Request.
- Before every commit (automated or manual), verify the current branch with:

  git branch --show-current

  This verification is required in local workflows and must be enforced by automation where possible (pre-commit hooks, CI guards). Commits must fail if the active branch is `main`.
- Branch naming: follow existing conventions (e.g., `feat/`, `fix/`, `docs/`, `chore/`) and include the issue/board ID when applicable.
- PR-first workflow: open a PR for every change, reference the issue/board card, and move the board state according to the Roadmap ↔ Board Sync Policy.

### Exception process

- An exception to commit on `main` is permitted only when a named stakeholder explicitly requests it and at least one human maintainer approves in writing (issue comment, Slack/Email thread, or PR). Record approval in the related issue or PR.
- Prefer creating a short-lived branch from `main` and merging via PR even when approval is granted. Force-pushes to `main` are forbidden unless explicitly authorized and accompanied by a documented rollback plan.

### Enforcement & PR checks

- Reviewers must verify in the PR checklist that no commits were made directly to `main` and that the branch verification step was followed when applicable.
- CI should include a guard that fails merges or automated commits originating from `main` without the documented exception (see docs/agent-runbook.md for checklist templates).
