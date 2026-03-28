# 🏪 Common Cornershop

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Sistema de gestão completo para lojinha de esquina**

[Quick Start](#-quick-start) • [Documentação](#-documentação)

</div>

---

## 📋 Visão Geral

**Common Cornershop** é uma API REST robusta e escalável desenvolvida para gestão completa de lojas de esquina (cornershops). O sistema permite gerenciar produtos, categorias, estoque e pedidos de forma eficiente, aplicando princípios de **Domain-Driven Design (DDD)** e **Clean Architecture**.

Construído como um **monorepo gerenciado pelo NX**, o projeto separa claramente as responsabilidades entre camadas de domínio, aplicação e infraestrutura, garantindo manutenibilidade, testabilidade e evolução sustentável do código.

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0
- **PostgreSQL** >= 14.0
- **Docker** (opcional)

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/common-cornershop.git
cd common-cornershop

# 2. Instalar dependências
yarn install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações

# 4. Subir banco de dados (Docker)
docker-compose up -d postgres

# 5. Executar migrations
yarn migration:run

# 6. Popular dados iniciais (opcional)
yarn seed

# 7. Iniciar aplicação
yarn start:dev
```

A API estará disponível em: **http://localhost:3000**

---

## 📚 Documentação

| Documento | O que você encontra |
|---|---|
| [project-structure.md](docs/project-structure.md) | Árvore completa do monorepo com o papel de cada diretório e sufixo de arquivo. |
| [architecture.md](docs/architecture.md) | Responsabilidades de cada camada, fluxo de dependências e padrões de DI com TSyringe. |
| [conventions.md](docs/conventions.md) | Nomenclatura, organização de imports, padrão de commits e regras de estilo de código. |
| [domain-model.md](docs/domain-model.md) | Diagrama ER e descrição das entidades: Category, Product, Stock, Order, OrderItem. |
| [error-handling.md](docs/error-handling.md) | Contrato de erros, envelope JSON, hierarquia de DomainError e como adicionar novos erros. |
| [testing.md](docs/testing.md) | Setup do Jest, padrão AAA, mocks, thresholds de cobertura e exemplos de testes. |
| [api-endpoints.md](docs/api-endpoints.md) | Referência completa de todos os endpoints: request, response, status codes e erros. |
| [database.md](docs/database.md) | Uso do TypeORM CLI, migrations, seeds e configuração do banco de teste. |
| [openapi.md](docs/openapi.md) | Integração do Swagger com os schemas Zod existentes e convenções de metadados. |
| [examples.md](docs/examples.md) | Fluxos completos de ponta a ponta mostrando a interação entre todas as camadas. |
| [roadmap.md](docs/roadmap.md) | Fases do MVP, breakdown de tasks, dependências e critérios de conclusão. |
| [adr/0001-idioma-mensagens-de-erro.md](docs/adr/0001-idioma-mensagens-de-erro.md) | Decisão: código em inglês, campo `message` das respostas em pt-BR. |
| [adr/0002-error-handler-centralizado.md](docs/adr/0002-error-handler-centralizado.md) | Decisão: único `setErrorHandler` global no bootstrap da aplicação. |

---

## 🤝 Contribuindo

Leia [docs/conventions.md](docs/conventions.md) antes de abrir um PR.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">

**Feito com ❤️ para lojas de esquina**

[⬆ Voltar ao topo](#-common-cornershop)

</div>
