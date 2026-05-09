# Agent Runbook — Autonomous Delivery (Minimum)

## Purpose

Padronizar a execução paralela de tarefas por agentes/autonomias e garantir sincronização clara de status entre branches, PRs e o board. Documento curto e operacional — focado em evitar conflito de trabalho e drift de roadmap.

## Parallel flow with worktrees

1. Criar um worktree por task/branch para isolar mudanças (nome curto e identificável).
   - Exemplo mínimo: `git worktree add ../wt-task-123 task/branch` (apenas referência).
2. Implementar e validar mudanças dentro do worktree isolado. Mantê-lo auto-contido: tests, lints e pequenas validações locais.
3. Abrir um Pull Request por branch/task. PR deve conter referência à issue/ID do board e resumo conciso do que foi feito.

Notes:
- Use worktrees para evitar que múltiplos agentes escrevam na mesma cópia da branch local.
- Sempre verifique o branch base antes de criar o worktree (evitar drift do main).

## Mandatory branch verification & commit policy

- Never commit directly on `main` by default. Work must be done on a branch and delivered via a Pull Request.
- Before every commit (automated or manual), verify the current branch with:

  git branch --show-current

  Agents and contributors must include this check in local scripts or pre-commit hooks. Automation that performs commits must assert the active branch is not `main` and fail otherwise.

### Exception and approvals

- Exceptions are only allowed when a named stakeholder explicitly requests the change and at least one human maintainer approves in writing (issue comment, Slack/Email thread, or PR). Approval must be recorded and linked to the work.
- Prefer creating a short-lived branch from `main` and merging via PR even when exception is granted. Force-pushes to `main` are strongly discouraged and require a documented rollback plan.

## Status sync sequence (board is canonical)

Follow the official state machine: Backlog -> In Progress -> Review -> Done.

1. Issue created / task assigned -> Move card to "Backlog".
2. When work starts -> Move card to "In Progress".
3. PR opened for the branch -> Move card to "Review".
4. PR merged -> Close the issue and move card to "Done" (merge is the signal to complete).
5. Roadmap updates: document-level roadmap edits must go to a separate `docs/*` branch and be synchronized with the board (do not mix roadmap edits with feature PRs unless explicitly scoped).

Rationale: o board é canônico para estado de trabalho; PR/merge é a fonte de verdade para conclusão.

## Anti-slop checklist (required before PR)

- [ ] Remover comentários óbvios/redundantes no código e nas documentações (não deixar comentários de debugging).
- [ ] Evitar duplicação textual: não replicar o mesmo conteúdo no roadmap, notas e PR description — referencie a fonte única quando existir.
- [ ] Verificar consistência final entre PR, Issue, Board e (quando aplicável) Roadmap; títulos e IDs devem bater.
- [ ] Evitar mudanças fora do escopo declarado pela issue/task — se necessário, abrir nova issue ou separar em outro PR.

## Pre-commit & PR checklist (operational - add to automation)

- [ ] git branch --show-current != main (mandatory)
- [ ] Tests and linters pass in the worktree
- [ ] PR references issue/board card and includes approval evidence if exception applied
- [ ] Commit messages compact and meaningful; squash when necessary for PR clarity

### Recovery checklist: accidental commit to main

1. Local, NOT pushed to origin:

   - Create a branch to preserve work: `git branch fix/<short-desc>`
   - Reset local main to remote: `git reset --hard origin/main`
   - Checkout the new branch and continue work: `git checkout fix/<short-desc>`

2. Pushed to `origin/main`:

   - Do NOT force-push unless explicit recorded approval exists.
   - Notify maintainers immediately and open an issue with the bad commit SHA and description.
   - Create a revert PR using `git revert <sha>` or cherry-pick intended commits onto a new branch and open a PR to restore the intended state.
   - If force-push removal is approved, document approval in the issue and coordinate with CI to avoid automated deployments during remediation.

Add these checklists to local agent scripts, pre-commit hooks, and CI where possible to enforce the rules.

Checklist rápido de qualidade:
- Compacte mensagens de commit quando fizer sentido para legibilidade do PR.
- Assegure que testes relevantes passam no ambiente do worktree antes de abrir o PR.

## Final housekeeping

- Voltar para `main` e atualizar: `git checkout main` + `git pull` (exemplo referencial).
- Limpar branches/worktrees locais quando apropriado: remova worktrees finalizados e branches locais obsoletos para reduzir confusão operacional.
  - Preferir `git worktree prune` / `git worktree remove` conforme política local.

## Minimal operational guidance

- Mantenha cada PR focado e pequeno — facilita revisão humana e reduz risco de merge conflicts.
- Para mudanças em docs/roadmap, utilize branch separado e link para a issue/epic no PR.
- Board -> PR -> Merge é a sequência esperada; qualquer desvio deve ser explicitado na issue.

## Non-goals

- Este runbook não substitui políticas formais do repositório (CONTRIBUTING, AGENTS), nem descreve políticas de CI/CD específicas.
- Não cobre comandos extensos ou scripts de automação — foco é operacional humano/agent.

## Quick reminders

- Antes de abrir PR: confirme que a branch base está atualizada; título/descrição do PR referenciam a issue; checklist anti-slop completo.
- Se múltiplos agentes trabalham na mesma feature, combine um sub-coordination card no board para evitar stepping-on-toes.

---

Documento curto para uso diário por agentes/autonomias. Evitar duplicação com AGENTS/CONTRIBUTING; foco prático.
