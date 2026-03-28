# AGENTS.md — Common Cornershop

Guidance for agentic coding assistants working in this repository.

---

## Project Overview

NX monorepo implementing a REST API with **Clean Architecture** and **DDD**.

**Stack:** TypeScript 5+, Node.js 18+, Fastify, TypeORM, PostgreSQL, Zod, TSyringe, NX.

**Strict dependency rule:** `apps/api` → `libs/domain` → `libs/shared`. Never reverse.

```
apps/api/          # Fastify HTTP layer (controllers, schemas, repositories impl, DI)
libs/domain/       # Business logic (entities, use cases, services, repo interfaces)
libs/shared/       # Shared utilities, types, constants (no framework deps)
tests/e2e/         # End-to-end tests
docs/              # Architecture docs, ADRs, conventions
```

---

## Essential Commands

```bash
yarn install              # Install dependencies
yarn start:dev            # Start in watch mode
yarn build                # Compile entire project
yarn lint                 # Run ESLint
yarn format               # Run Prettier

yarn test                 # All tests
yarn test:unit            # Unit tests only (*.spec.ts, excludes e2e)
yarn test:integration     # Integration tests (repositories + controllers)
yarn test:e2e             # E2E tests (*.e2e-spec.ts)
yarn test:watch           # Watch mode
yarn test:coverage        # All tests + coverage report

# Run a single test file
yarn test path/to/file.spec.ts

# Run tests matching a description
yarn test -t "should calculate total"

yarn migration:generate   # Generate migration from entity changes
yarn migration:run        # Run pending migrations
yarn migration:revert     # Revert last migration
yarn seed                 # Run all seeds
```

---

## Documentation Index

### [`docs/project-structure.md`](docs/project-structure.md)
Full annotated directory tree of the monorepo. Read this first when navigating the codebase — it maps every directory and file suffix to its role (`*.entity.ts`, `*.usecase.ts`, `*.repository.impl.ts`, etc.) and explains what belongs in each layer.

### [`docs/architecture.md`](docs/architecture.md)
Layer responsibilities, dependency flow diagram (Controllers → UseCases → Services → Repositories), DI patterns with TSyringe, and the rules that define what code is allowed in each layer. Consult before creating any new class or module.

### [`docs/conventions.md`](docs/conventions.md)
All code style rules in one place: naming conventions (camelCase / PascalCase / UPPER_SNAKE_CASE / snake_case), file naming pattern (`{name}.{type}.ts`), import ordering (3-group: external → `@domain/` `@shared/` → relative), JSDoc requirements, and git conventions (Conventional Commits + branch naming).

### [`docs/domain-model.md`](docs/domain-model.md)
ER diagram and description of all domain entities: `Category`, `Product`, `Stock`, `Order`, `OrderItem`. Shows relationships, fields, and the `BaseEntity` (id, createdAt, updatedAt, deletedAt). Reference when adding or modifying entities.

### [`docs/error-handling.md`](docs/error-handling.md)
The full error contract: the JSON envelope format (`error` in English, `message` in pt-BR, no status in body), the `DomainError` hierarchy, how the centralized `setErrorHandler` classifies exceptions (domain / Zod validation / unexpected), the `errorMap`, and the step-by-step for adding a new domain error. Also cross-references ADR-0001 and ADR-0002.

### [`docs/testing.md`](docs/testing.md)
Jest setup for the NX workspace, all test script flags, the AAA (Arrange-Act-Assert) pattern, `describe → describe → it` structure, mocking patterns (including TSyringe container mocks), coverage thresholds (global 80% lines/functions; `*.service.ts` 90%), fixtures/factories conventions, and full example specs for unit, integration (Fastify inject), and E2E tests.

### [`docs/api-endpoints.md`](docs/api-endpoints.md)
Complete REST API reference: every endpoint for Categories, Products, Stock, and Orders — with request/response shapes, query parameters, status codes, and error payloads. Use as the canonical contract when implementing controllers and schemas.

### [`docs/database.md`](docs/database.md)
TypeORM CLI usage, migration workflow, seed scripts, test database setup (port 5433), entity configuration, and soft-delete conventions. Read before writing migrations or repository implementations.

### [`docs/openapi.md`](docs/openapi.md)
How to integrate `@fastify/swagger` + `@fastify/swagger-ui` with existing Zod schemas using `zod-to-json-schema`. Covers plugin registration, route metadata conventions (`tags`, `summary`, `operationId`), and how to keep the Swagger UI at `/docs` in sync with the API.

### [`docs/examples.md`](docs/examples.md)
End-to-end walkthroughs of complete request flows (e.g. creating an order) showing how each layer — controller, use case, service, repository — interacts. Useful for understanding the full call chain before implementing a new feature.

### [`docs/roadmap.md`](docs/roadmap.md)
Implementation roadmap for the MVP: phases, task breakdown, dependencies between tasks, and done criteria. Consult to understand what has been prioritized and in what order work should proceed.

### [`docs/adr/0001-idioma-mensagens-de-erro.md`](docs/adr/0001-idioma-mensagens-de-erro.md)
Decision record: all code in English; user-facing `message` fields in pt-BR. Defines where to centralize error message strings (`libs/shared/src/errors/messages/`) and the future i18n migration path.

### [`docs/adr/0002-error-handler-centralizado.md`](docs/adr/0002-error-handler-centralizado.md)
Decision record: single global `fastify.setErrorHandler` registered at bootstrap (`apps/api/src/plugins/error-handler.plugin.ts`). Prohibits scattered per-route error handling and defines the three classification categories the handler must cover.
