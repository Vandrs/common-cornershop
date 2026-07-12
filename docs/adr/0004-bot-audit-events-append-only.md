# ADR-0004: 🗒️ `bot_audit_events` como tabela append-only (sem soft-delete)

## Status

Aceito

## Contexto

O documento `docs/bot-ia-architecture.md` define a arquitetura do Bot de Vendas IA (LangChain + LangGraph), incluindo uma tabela de auditoria `bot_audit_events` no PostgreSQL para registrar eventos críticos do bot (ex.: `order_creation_attempted`, `order_created`, `intent_detected`), usada tanto para auditoria/compliance quanto como fonte de dados para observability e pipelines de ML feedback.

Todas as entidades do domínio hoje seguem a convenção padrão de `BaseEntity` (`id`, `createdAt`, `updatedAt`, `deletedAt`), com soft-delete conforme `docs/database.md` e `docs/domain-model.md`.

Ao desenhar `bot_audit_events`, identificamos um conflito com essa convenção:

- Uma trilha de auditoria precisa ser imutável — permitir soft-delete (ou qualquer forma de exclusão/edição) em registros de auditoria contradiz o próprio propósito de auditoria e explicabilidade descrito nos guardrails de `create_order` (item 4 — "Audit e explicabilidade").
- Não há caso de uso legítimo para "restaurar" um evento de auditoria soft-deletado — diferente de entidades transacionais como `Order`, cujo histórico pode precisar de correção/estorno.
- Aplicar `BaseEntity` traria uma coluna `deletedAt` sem significado operacional, criando ambiguidade sobre se registros de auditoria podem ou não ser removidos logicamente.

## Decisão

`bot_audit_events` será uma tabela **append-only**, ou seja:

- Não estende `BaseEntity`. Não possui coluna `deletedAt` nem `updatedAt` — registros são escritos uma única vez e nunca atualizados.
- Campos mínimos: `id` (uuid), `occurred_at` (timestamptz, default `now()`), `event_type` (text), `client_id`, `session_id`, `idempotency_token`, `payload` (jsonb), `processed` (boolean, default `false`) — usado apenas para marcar consumo por pipelines downstream (ex.: ML feedback), nunca para ocultar/expirar o registro em si.
- Exclusão física só ocorre via rotina de retenção (purge), nunca via soft-delete aplicacional. A rotina de retenção respeita a política definida em `docs/bot-ia-architecture.md`: 7 dias em desenvolvimento/local (uso de estudos) e 30 dias em staging/produção, configurável via variável de ambiente (ex.: `AUDIT_RETENTION_DAYS`).
- Nenhum endpoint da API deve expor operação de update/delete lógico sobre `bot_audit_events`; leitura é sempre read-only para consumidores externos (observability, ML feedback).

## Consequências

Positivas

- Garantia de imutabilidade da trilha de auditoria — alinhado ao guardrail de "Audit e explicabilidade" do bot.
- Simplifica o modelo: sem necessidade de filtros `deletedAt IS NULL` em nenhuma query de leitura desta tabela.
- Reduz risco de um bug de aplicação apagar/ocultar evidências de auditoria acidentalmente.

Negativas / Trade-offs

- Diverge da convenção padrão do domínio (`BaseEntity`), exigindo atenção extra de quem for revisar código/migrations dessa entidade — deve ficar claro (via comentário no código e nesta ADR) que essa é uma exceção intencional.
- Crescimento de volume ao longo do tempo, mitigado pela rotina de retenção (purge por idade), que precisa ser implementada como job/scheduled task e testada.
- Sem `deletedAt`, qualquer necessidade futura de "anonimizar" PII em eventos antigos (por exemplo, por solicitação de titular de dados) exigirá um mecanismo específico de redação de payload em vez de soft-delete — deve ser tratado à parte se/quando necessário.

## Alternativas consideradas

| Alternativa | Descrição | Por que foi descartada / observações |
| --- | --- | --- |
| Estender `BaseEntity` (com soft-delete) | Usar o padrão default do domínio, incluindo `deletedAt` | Contradiz o propósito de imutabilidade da auditoria; nenhum fluxo de negócio precisa "restaurar" um evento de auditoria. Descartada. |
| Tabela mutável com campo `isArchived` | Registro pode ser marcado como arquivado em vez de deletado | Não resolve o problema real (imutabilidade); adiciona complexidade sem benefício claro sobre apenas usar `processed` para consumo. Não escolhida. |
| Streaming direto para um Event Broker (sem tabela local) | Substituir a tabela por publish direto em Kafka/RabbitMQ | Já descartado por decisão anterior — Event Broker adiado até existir consumidor real definido (ver `docs/bot-ia-architecture.md`, seção "Decisões registradas"). |

## Compatibilidade com o roadmap / arquitetura do bot

- Esta ADR é específica da fase "Bot de Vendas IA" (`docs/bot-ia-architecture.md`), ainda não incluída como fase formal em `docs/roadmap.md`.
- Ao criar a migration `{timestamp}-CreateBotAuditEventsTable.ts`, seguir a convenção de nomenclatura de `docs/database.md`, mas sem incluir a coluna `deletedAt` e sem registrar a entidade com o comportamento padrão de soft-delete do TypeORM.
- Ao registrar a entidade em `data-source.ts`, documentar no próprio arquivo de entidade (comentário JSDoc) que ela não estende `BaseEntity` por decisão desta ADR.

## Plano de revisão futura

Revisar esta decisão nas seguintes circunstâncias:

1. Se surgir um requisito legal/negócio de anonimização ou remoção de dados de auditoria (ex.: solicitação de exclusão de dados pessoais) — reavaliar se é necessário um mecanismo de redação de payload em vez de soft-delete.
2. Quando a fase Bot IA for formalizada em `docs/roadmap.md`, revisar se o volume real observado ainda é compatível com a política de retenção definida (7/30 dias) ou se precisa ser recalibrada.
3. Ao introduzir o Event Broker (quando houver consumidor real definido), reavaliar se `bot_audit_events` permanece como fonte primária ou passa a ser um buffer/staging antes da publicação de eventos.

## Referências

- `docs/bot-ia-architecture.md` — arquitetura do Bot de Vendas IA, seção "Auditoria & Observability" e "Decisões registradas".
- `docs/database.md` — convenções de migrations e soft-delete.
- `docs/domain-model.md` — `BaseEntity` e entidades padrão do domínio.
- ADR-0003 (`docs/adr/0003-soft-delete-order-orderitems.md`) — outra decisão que trata de exceções à convenção padrão de soft-delete.

## Checklist de verificação

1. Terminologia consistente: `bot_audit_events`, append-only, `BaseEntity` — verificado.
2. Diagrama-texto parity: não aplicável (sem diagrama próprio; referencia o diagrama de componentes do doc de arquitetura do bot).
3. Exemplos de schema: incluídos em `docs/bot-ia-architecture.md` (seção "Auditoria & Observability").
4. Plano de migração/rollback: exclusão apenas via rotina de purge por retenção; sem rollback de soft-delete aplicável (tabela não suporta soft-delete).
5. Segurança & Compliance: retenção definida por ambiente (7 dias dev/local, 30 dias staging/produção); redação de PII no payload deve seguir a mesma política de logs estruturados do doc de arquitetura do bot.
6. Performance targets: overhead mínimo esperado (baixo volume — uso de estudos); índice recomendado em `event_type` e `occurred_at` caso o volume cresça.

Se algum item não estiver cumprido, abrir issue `maintainer-review` referenciando este ADR.

## Changelog

- 2026-07-12: Criação do ADR-0004 — decisão de que `bot_audit_events` é uma tabela append-only, sem soft-delete, divergindo da convenção padrão de `BaseEntity`. (autor: arquitetura)
