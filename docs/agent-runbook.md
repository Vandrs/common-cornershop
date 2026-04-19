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
