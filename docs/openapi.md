# 📐 OpenAPI / Swagger

## Escopo

Este documento descreve a adoção do OpenAPI (Swagger) no projeto Common Cornershop: bibliotecas recomendadas, instalação, configuração no Fastify, integração com os Zod schemas já existentes, convenções de tags e boas práticas para manter a documentação como fonte confiável da API.

Resumo executivo

- Objetivo: gerar e servir automaticamente a especificação OpenAPI 3.0 e uma UI interativa (Swagger UI) baseada nos Zod schemas já existentes.
- Público: engenheiros backend, devs responsáveis pelas rotas e reviewers de PR.

---

## 🎯 Goals e Non-goals

Goals

- Fornecer instruções claras para usar OpenAPI no Fastify com os schemas Zod existentes
- Garantir que a documentação seja gerada automaticamente e acessível em /docs
- Definir convenções mínimas para metadados e tags

Non-goals

- Não incluir código de produção definitivo (apenas exemplos ilustrativos)
- Não cobrir autenticação avançada ou geração automática de clients (pode ser futuro)

---

## 📚 Bibliotecas recomendadas

|            Biblioteca | Papel                                                                                                                   |
| --------------------: | :---------------------------------------------------------------------------------------------------------------------- |
|    `@fastify/swagger` | Gera o spec OpenAPI 3.0 a partir das rotas Fastify e dos schemas declarados nas rotas.                                  |
| `@fastify/swagger-ui` | Serve uma interface interativa (Swagger UI) para explorar e testar a API em /docs.                                      |
|  `zod-to-json-schema` | Converte Zod schemas (nosso fonte da verdade) em JSON Schema compatível com OpenAPI, evitando duplicação de validações. |

Breve explicação

- @fastify/swagger: responsável por compilar os metadados (schema, tags, summary, responses) expostos nas rotas e montar o spec JSON/YAML.
- @fastify/swagger-ui: serve os assets do Swagger UI e mapeia a rota /docs para a interface interativa.
- zod-to-json-schema: mantém Zod como fonte da verdade — converte Zod → JSON Schema para ser referenciado nas rotas Fastify.

---

## ⚙️ Instalação

Instale as dependências com yarn:

```bash
# Instala bibliotecas necessárias para gerar e servir OpenAPI/Swagger
yarn add @fastify/swagger @fastify/swagger-ui zod-to-json-schema
```

---

## 🔌 Configuração do plugin no Fastify (exemplo ilustrativo)

Arquivo sugerido: `apps/api/src/plugins/swagger.plugin.ts`

Exemplo (pseudo-código TypeScript-like):

```typescript
// apps/api/src/plugins/swagger.plugin.ts
// Pseudo-código ilustrativo — não código de produção
import fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export const registerSwagger = async (app: FastifyInstance) => {
  // Registra gerador do spec OpenAPI
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Common Cornershop API', // título da API
        description: 'API REST para gestão de lojas de esquina',
        version: '1.0.0', // versão da API (sincronizar com package.json se possível)
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local' }],
    },
    // Opcional: personalizações do schema
    // hideUntagged: false, // mostrar rotas sem tags
  });

  // Registra UI em /docs (rota estática para Swagger UI)
  await app.register(swaggerUi, {
    routePrefix: '/docs', // UI disponível em /docs
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    // url: '/docs/json' // (opcional) endpoint do spec
  });
};

// No bootstrap da aplicação (ex: apps/api/src/server.ts) -> registerSwagger(app)
```

Notas

- O Fastify expõe automaticamente endpoints auxiliares (dependendo da configuração): um JSON spec (/docs/json) e um YAML spec (/docs/yaml) além da UI em /docs.
- O Fastify expõe automaticamente endpoints auxiliares (dependendo da configuração): um JSON spec (/docs/json) e um YAML spec (/docs/yaml) além da UI em /docs. No repositório atual a UI é registrada em `apps/api/src/plugins/swagger.plugin.ts` e os schemas usados pelo gerador vêm do diretório `apps/api/src/http/schemas/` registrados via `apps/api/src/plugins/http-schemas.plugin.ts`.
- Mantenha title/description/version atualizados; use CI para garantir version bumps.

---

## 🔗 Integração com Zod schemas existentes

Objetivo: evitar duplicação — manter Zod como fonte da verdade e converter para JSON Schema quando necessário.

Fluxo recomendado (ilustrativo)

1. Mantenha os Zod schemas dentro de `apps/api/src/http/schemas/` (local atual no repositório).
2. No registro da rota Fastify, converta os schemas Zod para JSON Schema usando `zodToJsonSchema` e passe o resultado para a propriedade `schema` da rota: { body, querystring, params, response }.

Exemplo (pseudo-código) — schema de criação de pedidos

```typescript
// apps/api/src/http/schemas/orders.schema.ts
import { z } from 'zod';

export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

// Em uma rota Fastify (pseudo-código):
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createOrderSchema } from '../schemas/order.schemas';

// No repositório atual existe um plugin `apps/api/src/plugins/http-schemas.plugin.ts` que registra
// várias definições convertidas com zod-to-json-schema no Fastify usando `app.addSchema()`.
// Alternativamente, você pode converter localmente com zodToJsonSchema e injetar no objeto `schema` da rota.

const createOrderJsonSchema = zodToJsonSchema(createOrderSchema, {
  target: 'openApi3',
  name: 'OrdersCreateBody',
});

fastify.post('/api/orders', {
  schema: {
    // Converte e injeta o JSON Schema no Fastify
    body: createOrderJsonSchema,
    response: {
      201: {
        // Exemplo de response schema — também pode ser gerado a partir de Zod
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          orderNumber: { type: 'string' },
          status: { type: 'string' },
          totalAmount: { type: 'number' },
        },
      },
    },
  },
  handler: async (request, reply) => {
    // handler -> usa UseCases, Services, etc.
  },
});

// Comentário: preferir gerar também o schema de resposta via Zod quando possível
```

Observações

- Nem todas as propriedades Zod são automaticamente convertidas com metadados OpenAPI (por exemplo: descrições). Pode-se enriquecer o JSON Schema manualmente após conversão.
- Para evitar erros de tipos, adicione sempre 'title' no zodToJsonSchema (ex: 'CreateOrder') para identificar componentes.

---

## 🏷️ Anotando rotas com metadados OpenAPI

Para gerar documentação útil, as rotas devem conter metadados: tags, summary, description e operationId.

Exemplo ilustrativo por grupo de endpoints:

Categories

```typescript
fastify.get(
  '/api/categories',
  {
    schema: {
      tags: ['Categories'],
      summary: 'Lista categorias',
      description: 'Retorna lista paginada de categorias ativas',
      operationId: 'listCategories',
      querystring: {
        /* json schema gerado a partir de Zod */
      },
    },
  },
  handler,
);
```

Products

```typescript
fastify.get(
  '/api/products/:id',
  {
    schema: {
      tags: ['Products'],
      summary: 'Obter produto',
      description: 'Retorna um produto por ID com informação de estoque',
      operationId: 'getProductById',
      params: {
        /* json schema */
      },
      response: {
        /* json schema de resposta */
      },
    },
  },
  handler,
);
```

Orders

```typescript
fastify.post(
  '/api/orders',
  {
    schema: {
      tags: ['Orders'],
      summary: 'Criar pedido',
      description: 'Cria um pedido com lista de itens e valida disponibilidade de estoque',
      operationId: 'createOrder',
      body: {
        /* json schema */
      },
      response: {
        201: {
          /* json schema */
        },
        400: {
          /* json schema */
        },
      },
    },
  },
  handler,
);
```

Recomendação

- Padronize operationId como <verb><Resource><Qualifier?> (ex: createOrder, listProducts, getCategoryById).

---

## 🏷️ Convenção de Tags (padrões do projeto)

- Categories
- Products
- Orders

Use as tags exatamente como acima para manter a UI e os filtros consistentes.

---

## 🌐 Acesso à documentação

Após a configuração, os endpoints padrões são:

- Swagger UI: http://localhost:3000/docs
- JSON Spec: http://localhost:3000/docs/json
- YAML Spec: http://localhost:3000/docs/yaml

Observação: dependendo da versão do @fastify/swagger as rotas exatas podem variar; confirme no plugin registrado.

---

## ✅ Boas práticas (project-specific)

- Sempre adicionar `summary` e `description` nas rotas — ajudam usuários e geradores de cliente.
- Usar `tags` consistentes com os módulos do projeto (Categories, Products, Orders).
- Definir `response` schemas para todos os status codes documentados em `docs/api-endpoints.md` (200, 201, 400, 404, 500).
- Manter os Zod schemas como fonte da verdade (evitar duplicação de validação). Use `zod-to-json-schema` para conversão.
- Versionar a API no path quando houver breaking changes (ex: `/api/v1/...`).
- Enriquecer os schemas com descrições e exemplos quando possível para melhorar a experiência na UI.

---

## ⚠️ Considerações de Segurança e Produção

- Não exponha a UI do Swagger em produção sem autenticação — use feature flag ou proteção por IP/basic auth.
- Remova ou proteja endpoints sensíveis (ex: administración) da UI pública.
- Sanitizar e limitar exemplos de payloads que possam conter dados sensíveis.

---

## 🧭 Fluxo de alto nível (mermaid)

```mermaid
flowchart LR
  Client[Cliente / Dev] -->|GET /docs| SwaggerUI[Swagger UI (/docs)]
  Client -->|GET /docs/json| Spec[OpenAPI JSON]
  Server[Fastify API] -->|@fastify/swagger| SwaggerPlugin[Swagger Plugin]
  SwaggerPlugin --> Spec
  Server -->|routes use Zod| Schemas[Zod Schemas]
  Schemas -->|zod-to-json-schema| JSONSchema
  JSONSchema --> SwaggerPlugin
```

---

## 🔁 Versioning & Evolução de Schemas

- Use semantic versioning na propriedade info.version do OpenAPI e versionamento via path quando quebra de contrato ocorrer.
- Para evoluções não breaking, mantenha compatibilidade backward/forward: tornar campos opcionais invés de removê-los.
- Para renome de campo ou alteração incompatible, ofereça um período de transição com ambas as versões (ex: /api/v1 e /api/v2) e um plano de migração para consumidores.

---

## ✅ Verificação / Checklist de Integração (para PRs)

Antes de mesclar PRs que alterem rotas ou schemas, valide:

1. Terminologia consistente: tags, operationId, nomes de schemas.
2. Diagram-text parity: rotas novas aparecem no Swagger UI e no spec JSON/YAML.
3. Schema examples: exemplos de payloads/response seguem o JSON Schema gerado.
4. Migration plan: mudanças breaking têm plano de migração/feature toggle.
5. Segurança: UI protegida em ambientes não-dev.
6. Performance targets: confirm que geração do spec não impacta tempo de startup (monitorar).

Se algum item falhar, inclua correção no PR ou reprove até ajustes.

---

## 🧪 Testes e Verificação Automática

- Adicione um job de CI que inicie a aplicação (modo headless) e valide que `/docs/json` responde com 200 e é um JSON válido.
- Adicione um job de CI que inicie a aplicação (modo headless) e valide que `/docs/json` responde com 200 e é um JSON válido. Como alternativa mais robusta, execute os testes localizados em `apps/api/src/http/schemas/__tests__/schemas.spec.ts` que validam os schemas e a integração com o error handler.
- Contract tests: para consumidores internos, gere snapshot do spec e compare em PRs para detectar mudanças involuntárias.
- Lint de schemas: verifique que todos os endpoints listados em `docs/api-endpoints.md` possuem metadados básicos (tags/summary/response).

---

## Migração e Rollout (resumo)

1. Instalar dependências em branch feature
2. Registrar plugin apenas em ambientes dev/staging inicialmente
3. Converter alguns endpoints críticos usando zod-to-json-schema e validar UI
4. Habilitar proteção na UI em produção (auth/feature flag)
5. Comunicar consumidores sobre o spec e onde encontrar (links no README)

---

## Changelog

- 2026-03-23: Documento inicial introduzindo configuração, integração com Zod e boas práticas.

---

[⬆ Voltar para README](../README.md)
