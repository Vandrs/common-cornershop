# ADR-0003: 🗂️ Soft-delete de Order e OrderItem (não em cascata)

## Status

Aceito

## Contexto

No domínio de pedidos (Order / OrderItem) a necessidade de preservar histórico e auditoria é priorizada. As entidades já seguem a convenção de soft-delete (campo deletedAt) conforme `docs/database.md` e `docs/domain-model.md`.

Durante discussões de implementação surgiram duas abordagens opostas:

- Fazer cascade soft-delete: ao soft-deletar um Order, marcar seus OrderItems como soft-deleted automaticamente.
- Não fazer cascade: ao soft-deletar um Order, manter os OrderItems sem alteração, preservando seu histórico e vínculo original.

Requisitos/contexto adicional que afetaram a decisão:

- Histórico/auditoria é priorizado: registros de OrderItem devem permanecer imutáveis para fins de auditoria e reconciliação.
- Queries operacionais (por exemplo: dashboard de picking, fluxo de atendimento) devem evitar expor OrderItems de Orders soft-deletados; isso deve ser tratado no nível de consulta/serviço.
- Idempotência de criação de pedido (garantir que reenvios não criem duplicados) foi identificada como importante, mas seu escopo ficou adiado para uma fase posterior.
- Roadmap técnico e prioridades: esta decisão deve ser compatível com itens planejados nas milestones T4.3, T4.4 e T5.3.

## Decisão

Decidimos que o soft-delete de uma entidade Order NÃO fará cascade soft-delete em seus OrderItems. Em outras palavras:

- Ao marcar Order.deletedAt = now(), os registros de OrderItem permanecem com seus campos deletedAt inalterados.
- A responsabilidade de não mostrar OrderItems pertencentes a Orders soft-deletados é do(s) repositório(s) / serviço(s) consumidores: consultas operacionais devem aplicar filtros (ex.: INNER JOIN com Order onde Order.deletedAt IS NULL) ou usar read-models que já armazenem apenas dados ativos.

Razões principais:

- Preservação de histórico/auditoria: manter os OrderItems intactos garante rastreabilidade granito-a-granito para fins fiscais, contábeis e investigações por incidente.
- Menor risco de inconsistência acidental: cascatas de soft-delete podem ocultar informação histórica e complicar restauração/rollback.

## Consequências

Positivas

- Histórico de items preservado integralmente para auditoria e análises forenses.
- Permite restauração de Orders sem perda de granularidade histórica dos OrderItems (restaurar Order não implica alterar OrderItems).

Negativas / Trade-offs

- Consultas que esperam somente itens "ativos" precisam explicitamente filtrar ou usar serviços/read-models preparados; aumenta a disciplina requerida aos desenvolvedores.
- Operações que assumem cascata automática (ex.: apagar UI/exports) precisam ser adaptadas.
- Maior necessidade de testes nas responsabilidades de leitura para evitar exposições indesejadas de data soft-deleted.

## Alternativas consideradas

| Alternativa                                                       | Descrição                                                                                       | Por que foi descartada / observações                                                                                                                                             |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cascata soft-delete (Order -> OrderItem)                          | Ao soft-deletar Order, marcar todos os OrderItems como soft-deleted                             | Pro: simplifica algumas queries operacionais; Con: perde granularidade de histórico e dificulta auditoria e restauração. Descartada por risco audit trail.                       |
| Dual-write com flag isArchived                                    | Manter Order e OrderItem e ter campo isArchived aplicado por negócio em vez de deletedAt        | Pro: separa conceito operacional de auditoria; Con: introduz novo campo sem benefício claro comparado ao filtro em consultas; aumenta superfície de consistência. Não escolhido. |
| Read-models materializados que expurgam itens de orders deletados | Construir projeções onde OrderItems associados a Orders deletados são automaticamente excluídos | Pro: fornece visão operacional limpa; Con: exige infra adicional (jobs/streams) e maturação. Considerada compatível como complemento (recomendada), não substituta.              |

## Impacto em T4.3

No contexto do roadmap, T4.3 contém tarefas relacionadas a "Operações de pedido" e "Interfaces de consulta" (ver roadmap). Impactos:

- T4.3: Repositórios e queries de OrderItem devem ser atualizados/planejados para filtrar Order.deletedAt quando o contexto for operacional. Implementações de repositório que retornam OrderItems para uso operacional devem JOIN/WHERE adequadamente.
- Se T4.3 inclui dashboards/exports, essas tarefas devem validar explicitamente que não expõem OrderItems ligados a Orders soft-deletados.

## Compatibilidade com roadmap (T4.3 / T4.4 / T5.3)

- T4.3 (prioridade alta): Ajustes de consultas + testes de integração para garantir que views/queries operacionais não retornem OrderItems de Orders deletados.
- T4.4 (prioridade média): Possível criação de read-models materializados (jobs diários ou streams) para prover visões operacionais limpas — compatível com esta decisão.
- T5.3 (prioridade baixa): Idempotência da criação de pedidos (adiada). Esta decisão não impede o trabalho de T5.3; entretanto, ao introduzir mecanismos de idempotência (ex.: dedup keys), testes de integração devem validar interações com soft-deletes e restauração de Orders.

## Plano de revisão futura

Revisar esta decisão nas seguintes circunstâncias ou prazos:

1. Quando T4.4 implementar read-models e o custo operacional de filtro em queries tornar-se oneroso — reavaliar se uma estratégia híbrida (projeções + marcação) é preferível.
2. Ao introduzir idempotência de criação de pedidos (T5.3), validar cenários onde reenvios interagem com Orders soft-deletados ou restaurados.
3. Em 12 meses ou após 2 releases maiores (o que ocorrer primeiro), executar revisão de ADR para confirmar que práticas e convenções de consulta foram adotadas.

## Referências

- docs/database.md — convenções de soft-delete e migrations.
- docs/domain-model.md — entidades Order e OrderItem.
- Roadmap — tarefas T4.3, T4.4, T5.3 (docs/roadmap.md).

## Checklist de verificação

1. Terminologia consistente: Order, OrderItem, soft-delete, deletedAt — verificado.
2. Diagrama-texto parity: este ADR descreve a política e aponta para locais de implementação (repositórios/read-models).
3. Exemplos de queries: documentar exemplos no guia de repositório (ex.: OrderItemRepository.findOperationalItems -> JOIN Order WHERE Order.deletedAt IS NULL).
4. Plano de migração/rollback: mantido — restauração de Order não altera OrderItems (rollback simples de deletedAt do Order).
5. Segurança & Compliance: preserva evidências para auditoria; verificar acesso a dados sensíveis conforme políticas.
6. Performance targets: assume-se overhead mínimo; otimizações via índices/queries ou read-models se necessário.

Se algum item não estiver cumprido, abrir issue `maintainer-review` referenciando este ADR.

## Trechos de exemplo (queries)

Exemplo simples de query operacional para OrderItems ativos:

```sql
SELECT oi.*
FROM order_item oi
JOIN "order" o ON o.id = oi.order_id
WHERE o.deleted_at IS NULL
  AND oi.deleted_at IS NULL;
```

## Changelog

- 2026-03-31: Criação do ADR-0003 — decisão por não aplicar cascade soft-delete de Order para OrderItem. (autor: arquitetura)
