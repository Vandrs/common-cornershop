# ADR-0002: 🛑 Handler de Erros Centralizado

## Escopo
Documenta a decisão de usar um único handler de erros global e centralizado na API construída com Fastify (NX monorepo, TypeScript, DDD + Clean Architecture).

## Resumo Executivo
Aceitamos um ponto único de tratamento de exceções registrado com fastify.setErrorHandler(handler) durante a bootstrap da aplicação. O handler classifica erros em três categorias (erros de domínio, erros de validação Zod e erros não mapeados), aplica mapeamentos HTTP consistentes e expõe respostas previsíveis ao cliente, preservando logs ricos para diagnóstico.

# ADR-0002: Handler de Erros Centralizado

## Status
Aceito

## Contexto
A API precisa de uma estratégia consistente para capturar, normalizar e formatar exceções antes de enviá-las ao cliente. O Fastify fornece um ponto de extensão global via fastify.setErrorHandler(handler) e também permite handlers por escopo/plugin. Sem convenção clara, mensagens e status retornados podem variar entre endpoints, prejudicando consumidores e a observabilidade.

Assumptions (pressupostos):
- Projeto: apps/api usando Fastify.
- ADR-0001 já trata i18n/idioma das mensagens (ver Referências).
- Código da API está em inglês, documentação em pt-BR.

## Decisão
Registrar um único handler global e centralizado via fastify.setErrorHandler(handler) durante a bootstrap da aplicação. Arquivo sugerido para implementação: `apps/api/src/plugins/error-handler.plugin.ts`.

O handler recebe qualquer erro lançado em qualquer rota e o classifica em 3 categorias:

1. Erros de Domínio (DomainError — classe base): erros do domínio são subclasses de DomainError e mapeados para HTTP por um mapa explícito (`errorMap`). O DomainError deve carregar informações mínimas: código interno (nome da classe), mensagem legível (padrão em pt-BR, sujeito a ADR-0001) e dados opcionais para contexto.
2. Erros de Validação Zod (ZodError): mapeados para 400 com um payload que inclui `details[]` com informações de cada campo inválido.
3. Erros não mapeados: qualquer outro erro. O handler registra a mensagem/stack completa usando o logger do Fastify e expõe ao cliente uma mensagem genérica e não sensível.

Implementação técnica (pontos-chave):
- O handler é registrado com fastify.setErrorHandler(...) na bootstrap (ex.: apps/api/src/main.ts ou plugin de bootstrap).
- Arquivo sugerido: `apps/api/src/plugins/error-handler.plugin.ts`.
- Mantemos um `errorMap` no plugin que traduz classes de erro de domínio para status HTTP e campos `error`/`message` públicos.
- O handler deve ser resiliente a formatos inesperados (ex.: erros de bibliotecas externas) e sempre ter um fallback para 500.

Mermaid - fluxo simplificado

```mermaid
flowchart LR
  Client[Cliente] -->|HTTP| Route[Route/Controller]
  Route -->|throw / reject| FastifyErrorHandler[fastify.setErrorHandler]
  FastifyErrorHandler -->|DomainError mapeado| DomainMap[Map → HTTP (4xx/409/...)]
  FastifyErrorHandler -->|ZodError| ZodResp[400 + details[]]
  FastifyErrorHandler -->|Não mapeado| GenericResp[500 + mensagem genérica]
  DomainMap --> Reply[Reply enviada]
  ZodResp --> Reply
  GenericResp --> Log[Logger (stack)] --> Reply
```

### Local sugerido do arquivo
`apps/api/src/plugins/error-handler.plugin.ts` (plugin/factory que registra o setErrorHandler durante o bootstrap)

### Pseudo-código ilustrativo
```typescript
// Pseudo-código ilustrativo — não é código de produção
// apps/api/src/plugins/error-handler.plugin.ts

// Mapa de erros de domínio → HTTP
const errorMap = {
  ProductNotFoundException: { statusCode: 404, error: 'ProductNotFoundException', message: 'Produto não encontrado' },
  InsufficientStockError:   { statusCode: 400, error: 'InsufficientStockError', message: 'Estoque insuficiente para o produto {nome}' },
  CategoryNotFoundException: { statusCode: 404, error: 'CategoryNotFoundException', message: 'Categoria não encontrada' },
  OrderNotFoundException: { statusCode: 404, error: 'OrderNotFoundException', message: 'Pedido não encontrado' },
};

fastify.setErrorHandler((error, request, reply) => {
  // Caso 1: Erro de Domínio mapeado
  if (error instanceof DomainError) {
    const meta = errorMap[error.constructor.name];
    if (meta) {
      return reply.status(meta.statusCode).send({
        error: meta.error,
        message: meta.message.replace('{nome}', error.context?.name ?? ''),
        details: error.context?.details ?? undefined,
      });
    }
  }

  // Caso 2: Erro de Validação Zod
  if (error.name === 'ZodError' /* instanceof ZodError */) {
    return reply.status(400).send({
      error: 'ValidationError',
      message: 'Dados inválidos',
      details: error.issues, // array de issues do Zod
    });
  }

  // Caso 3: Erro não mapeado — loga real, expõe genérico
  request.log.error({ err: error }, 'Unhandled error');
  return reply.status(500).send({
    error: 'InternalServerError',
    message: 'Erro interno do servidor',
  });
});
```

## Consequências

### Positivas
- Ponto único de mudança para tratamento de erros, facilitando manutenção e auditoria.
- Comportamento previsível e consistente para consumidores da API.
- Facilidade de instrumentação (logs, métricas, Sentry) num único local.

### Negativas / Trade-offs
- A centralização exige disciplina: handlers de escopo/plugins adicionados sem convenção podem conflitar silenciosamente com o handler global.
- Pode mascarar contexto específico do módulo se o DomainError não carregar dados de contexto suficientes.

### Riscos e Dívida Técnica
- Erros de terceiros (TypeORM, drivers, bibliotecas de rede) podem ter formatos inesperados — é necessário um fallback robusto e testes de integração que provoquem esses erros.
- Se mensagens de usuário precisam ser internacionalizadas, o handler precisará integrar-se ao mecanismo de i18n (ver ADR-0001). Se for adicionado ad-hoc, pode gerar duplicação.

## Alternativas Consideradas

1. Handlers por escopo/plugin (ex.: register setErrorHandler em um plugin específico): descartado — aumenta fragmentação, duplicação e dificulta a auditoria central.
2. try/catch manual em cada controller/route: descartado — muito repetitivo, propenso a inconsistências humanas e erros esquecidos.
3. Middleware de erro estilo Express: não aplicável/indesejado — Fastify não usa o mesmo modelo de middleware de erro do Express; abordar via plugin/global handler é a prática recomendada.

Outras opções breves avaliadas:
- Usar um gateway API para normalizar respostas (externalizar responsabilidade): aumenta latência e complexidade operacional.
- Event-driven retries/compensations: não resolve mapeamento HTTP de forma direta — complementar, não substituto.

## Guia de Extensão Futura

- Como adicionar um novo erro de domínio ao `errorMap` (passo a passo):
  1. Criar a nova classe que estende `DomainError` em `libs/domain/src/errors` com nome e campos de contexto.
  2. Adicionar uma entrada no `errorMap` em `apps/api/src/plugins/error-handler.plugin.ts` com `statusCode`, `error` e `message` (mensagem padrão em pt-BR; para i18n, ver ADR-0001).
  3. Escrever testes de integração que lancem a exceção a partir do fluxo real e validem o JSON retornado.

- Quando criar um handler de escopo:
  - Cenário típico: integração de terceiros com payloads/erros proprietários (ex.: webhooks) ou requisitos locais de formato de resposta.
  - Regras para não quebrar o global:
    1. Scoped handlers só devem ser registrados se documentados no README do módulo e aprovados em PR de arquitetura.
    2. Scoped handlers devem delegar para o handler global quando não reconheceram o erro (ex.: chamar reply.send ou lançar novamente).
    3. Manter convenção de nomes de erro e herança de DomainError para permitir mapeamento central quando aplicável.

- Evolução com i18n (referência ADR-0001):
  - Substituir mensagens fixas no `errorMap` por chaves de recurso (ex.: `errorMessages.productNotFound`) e resolver a mensagem final no handler consultando o locale do request (Accept-Language / header da aplicação).
  - Garantir fallback para pt-BR e testes que validem tanto chave quanto mensagem traduzida.

## Referências
- Fastify setErrorHandler — https://www.fastify.io/docs/latest/Reference/Server/#seterrorhandler
- Zod — https://github.com/colinhacks/zod
- ADR-0001 (i18n das mensagens): ../adr/0001-i18n.md

## Verificação / Checklist
1. Terminologia consistente: todos os termos usados (DomainError, ZodError, errorMap, handler global) aparecem no texto e diagramas — OK.
2. Diagrama-texto parity: o mermaid flowchart descreve os 3 caminhos citados — OK.
3. Exemplos de payloads/esquemas validam: pseudo-código usa campos declarados no texto (error, message, details) — OK.
4. Plano de migração/rollback: documentado no Guia de Extensão Futura (passos para adicionar e testar) — OK, mas ver Observação abaixo.
5. Segurança & Compliance: o handler não expõe stacks em produção; logs armazenam detalhes — ver Observação abaixo.
6. Performance targets: nenhum target explícito fornecido pelo time — ASSUMPTION: handler deve adicionar <1ms overhead médio; necessidade de confirmação.

Observações / Itens não resolvidos:
- Target de performance e SLA não foram fornecidos — confirmar se existem requisitos de latência/throughput.
- Nome/arquivo exato do ADR-0001 foi assumido como `0001-i18n.md`; ajustar se diferente.

## Changelog
- 2026-03-23: Criação do ADR-0002 — decisão por handler global centralizado. (autor: arquitetura)

## TODO / Próximos Passos (com responsáveis e prioridade)
- Implementar plugin `apps/api/src/plugins/error-handler.plugin.ts` com tests de integração — owner: Backend Team — prioridade: Alta
- Adicionar entradas iniciais do errorMap (lista da tabela) — owner: Backend Team — prioridade: Alta
- Adicionar testes de contrato que validem formato de erro para consumidores — owner: QA/Backend — prioridade: Média
- Integrar messages → i18n conforme ADR-0001 — owner: Infra/Plat Team — prioridade: Média

[⬆ Voltar para README](../../README.md)
