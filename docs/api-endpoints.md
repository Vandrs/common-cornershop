# 🔌 Endpoints da API

**Base URL**: `http://localhost:3000/api`

> 💡 **Documentação Interativa**: Com o servidor rodando, acesse a UI do Swagger em [`http://localhost:3000/docs`](http://localhost:3000/docs).  
> Os schemas usados pela documentação são definidos com Zod em `apps/api/src/http/schemas/` e registrados automaticamente no bootstrap. Para detalhes de configuração e como os Zod schemas são expostos, veja [docs/openapi.md](openapi.md).

---

## 📂 Categories

### `GET /api/categories`

Lista todas as categorias ativas com paginação.

#### Query Parameters

```typescript
{
  page?: number;      // Página atual (default: 1)
  limit?: number;     // Items por página (default: 10, max: 100)
}
```

#### Response 200 (Success)

```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Bebidas",
      "description": "Refrigerantes, sucos e águas",
      "isActive": true,
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z"
    },
    {
      "id": "223e4567-e89b-12d3-a456-426614174001",
      "name": "Snacks",
      "description": "Salgadinhos e petiscos",
      "isActive": true,
      "createdAt": "2026-03-15T10:05:00Z",
      "updatedAt": "2026-03-15T10:05:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

#### Response 400 (Bad Request)

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "limit",
      "message": "limit must be between 1 and 100"
    }
  ]
}
```

---

### `GET /api/categories/:id`

Retorna uma categoria específica por ID.

#### Path Parameters

- `id` (string, uuid): ID da categoria

#### Response 200 (Success)

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Bebidas",
  "description": "Refrigerantes, sucos e águas",
  "isActive": true,
  "createdAt": "2026-03-15T10:00:00Z",
  "updatedAt": "2026-03-15T10:00:00Z"
}
```

#### Response 404 (Not Found)

```json
{
  "error": "Category not found"
}
```

---

## 👤 Customers

### `POST /api/customers`

Cria um novo cliente.

#### Request Body

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999"
}
```

#### Validações

- `name`: obrigatório, 2–100 caracteres
- `email`: obrigatório, formato de e-mail válido, único
- `phone`: obrigatório, único

#### Response 201 (Created)

```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "createdAt": "2026-04-18T10:00:00Z",
  "updatedAt": "2026-04-18T10:00:00Z"
}
```

#### Response 400 (Bad Request)

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email"
    }
  ]
}
```

#### Response 409 (Conflict)

```json
{
  "error": "Customer already exists",
  "message": "Já existe um cliente com este e-mail ou telefone"
}
```

---

### `GET /api/customers/:id`

Retorna um cliente por ID.

#### Path Parameters

- `id` (string, uuid): ID do cliente

#### Response 200 (Success)

```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "createdAt": "2026-04-18T10:00:00Z",
  "updatedAt": "2026-04-18T10:00:00Z"
}
```

#### Response 404 (Not Found)

```json
{
  "error": "Customer not found",
  "message": "Cliente não encontrado"
}
```

---

## 🛍️ Products

### `GET /api/products`

Lista produtos com paginação e filtros.

#### Query Parameters

```typescript
{
  page?: number;          // Página atual (default: 1)
  limit?: number;         // Items por página (default: 10, max: 100)
  categoryId?: string;    // Filtrar por categoria (UUID)
  isActive?: boolean;     // Filtrar por status ativo
}
```

#### Response 200 (Success)

```json
{
  "data": [
    {
      "id": "323e4567-e89b-12d3-a456-426614174002",
      "name": "Coca-Cola 2L",
      "description": "Refrigerante de cola",
      "price": 8.5,
      "categoryId": "123e4567-e89b-12d3-a456-426614174000",
      "category": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Bebidas"
      },
      "isActive": true,
      "createdAt": "2026-03-15T10:00:00Z",
      "updatedAt": "2026-03-15T10:00:00Z"
    },
    {
      "id": "423e4567-e89b-12d3-a456-426614174003",
      "name": "Guaraná Antarctica 2L",
      "description": "Refrigerante de guaraná",
      "price": 7.5,
      "categoryId": "123e4567-e89b-12d3-a456-426614174000",
      "category": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Bebidas"
      },
      "isActive": true,
      "createdAt": "2026-03-15T10:10:00Z",
      "updatedAt": "2026-03-15T10:10:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 120,
    "totalPages": 12
  }
}
```

#### Response 400 (Bad Request)

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "categoryId",
      "message": "categoryId must be a valid UUID"
    }
  ]
}
```

---

### `GET /api/products/:id`

Retorna um produto específico com informações de estoque.

#### Path Parameters

- `id` (string, uuid): ID do produto

#### Response 200 (Success)

```json
{
  "id": "323e4567-e89b-12d3-a456-426614174002",
  "name": "Coca-Cola 2L",
  "description": "Refrigerante de cola",
  "price": 8.5,
  "categoryId": "123e4567-e89b-12d3-a456-426614174000",
  "category": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Bebidas"
  },
  "stock": {
    "id": "523e4567-e89b-12d3-a456-426614174004",
    "productId": "323e4567-e89b-12d3-a456-426614174002",
    "quantity": 45,
    "minimumQuantity": 10,
    "lastUpdatedAt": "2026-03-15T14:30:00Z"
  },
  "isActive": true,
  "createdAt": "2026-03-15T10:00:00Z",
  "updatedAt": "2026-03-15T10:00:00Z"
}
```

#### Response 404 (Not Found)

```json
{
  "error": "Product not found"
}
```

---

## 🛒 Orders

### `POST /api/orders`

Cria um novo pedido.

#### Request Body

```json
{
  "customerId": "uuid",
  "items": [
    {
      "productId": "323e4567-e89b-12d3-a456-426614174002",
      "quantity": 2
    },
    {
      "productId": "423e4567-e89b-12d3-a456-426614174003",
      "quantity": 1
    }
  ]
}
```

#### Response 201 (Created)

```json
{
  "id": "623e4567-e89b-12d3-a456-426614174005",
  "orderNumber": "ORD-1710501234567-A3F9",
  "status": "PENDING",
  "customerId": "uuid",
  "customer": { "id": "uuid", "name": "João Silva" },
  "totalAmount": 24.5,
  "items": [
    {
      "id": "723e4567-e89b-12d3-a456-426614174006",
      "productId": "323e4567-e89b-12d3-a456-426614174002",
      "product": {
        "id": "323e4567-e89b-12d3-a456-426614174002",
        "name": "Coca-Cola 2L",
        "price": 8.5
      },
      "quantity": 2,
      "unitPrice": 8.5,
      "subtotal": 17.0
    },
    {
      "id": "823e4567-e89b-12d3-a456-426614174007",
      "productId": "423e4567-e89b-12d3-a456-426614174003",
      "product": {
        "id": "423e4567-e89b-12d3-a456-426614174003",
        "name": "Guaraná Antarctica 2L",
        "price": 7.5
      },
      "quantity": 1,
      "unitPrice": 7.5,
      "subtotal": 7.5
    }
  ],
  "createdAt": "2026-03-15T15:00:00Z",
  "updatedAt": "2026-03-15T15:00:00Z"
}
```

#### Response 400 (Bad Request - Validation)

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "items",
      "message": "items must contain at least 1 item"
    }
  ]
}
```

#### Response 400 (Bad Request - Insufficient Stock)

```json
{
  "error": "Insufficient stock for product Coca-Cola 2L",
  "available": 1,
  "requested": 2
}
```

#### Response 404 (Not Found - Product)

```json
{
  "error": "Product not found",
  "productId": "323e4567-e89b-12d3-a456-426614174002"
}
```

#### Response 404 (Not Found - Customer)

```json
{
  "error": "Customer not found",
  "message": "Cliente não encontrado"
}
```

---

### `GET /api/orders/:id`

Retorna um pedido completo com todos os items.

#### Path Parameters

- `id` (string, uuid): ID do pedido

#### Response 200 (Success)

```json
{
  "id": "623e4567-e89b-12d3-a456-426614174005",
  "orderNumber": "ORD-1710501234567-A3F9",
  "status": "PROCESSING",
  "customerId": "uuid",
  "customer": { "id": "uuid", "name": "João Silva" },
  "totalAmount": 24.5,
  "items": [
    {
      "id": "723e4567-e89b-12d3-a456-426614174006",
      "productId": "323e4567-e89b-12d3-a456-426614174002",
      "product": {
        "id": "323e4567-e89b-12d3-a456-426614174002",
        "name": "Coca-Cola 2L"
      },
      "quantity": 2,
      "unitPrice": 8.5,
      "subtotal": 17.0
    },
    {
      "id": "823e4567-e89b-12d3-a456-426614174007",
      "productId": "423e4567-e89b-12d3-a456-426614174003",
      "product": {
        "id": "423e4567-e89b-12d3-a456-426614174003",
        "name": "Guaraná Antarctica 2L"
      },
      "quantity": 1,
      "unitPrice": 7.5,
      "subtotal": 7.5
    }
  ],
  "createdAt": "2026-03-15T15:00:00Z",
  "updatedAt": "2026-03-15T15:30:00Z"
}
```

#### Response 404 (Not Found)

```json
{
  "error": "Order not found"
}
```

---

### `GET /api/orders/:id/status`

Retorna apenas o status atual do pedido (endpoint otimizado).

#### Path Parameters

- `id` (string, uuid): ID do pedido

#### Response 200 (Success)

```json
{
  "id": "623e4567-e89b-12d3-a456-426614174005",
  "orderNumber": "ORD-1710501234567-A3F9",
  "status": "PROCESSING"
}
```

#### Response 404 (Not Found)

```json
{
  "error": "Order not found"
}
```

---

### `PATCH /api/orders/:id/status`

Atualiza o status de um pedido.

> ⚠️ **Efeitos colaterais de estoque:**
> - `PENDING → PROCESSING`: estoque dos produtos do pedido é **debitado**
> - `PROCESSING → CANCELLED`: estoque dos produtos do pedido é **devolvido**

#### Path Parameters

- `id` (string, uuid): ID do pedido

#### Request Body

```json
{
  "status": "PROCESSING"
}
```

#### Response 200 (Success)

```json
{
  "id": "623e4567-e89b-12d3-a456-426614174005",
  "orderNumber": "ORD-1710501234567-A3F9",
  "status": "PROCESSING"
}
```

#### Response 400 (Bad Request)

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "status",
      "message": "status must be one of: PENDING, PROCESSING, COMPLETED, CANCELLED"
    }
  ]
}
```

#### Response 404 (Not Found)

```json
{
  "error": "Order not found"
}
```

---

### `GET /api/orders`

Lista pedidos com paginação e filtros.

#### Query Parameters

```typescript
{
  page?: number;          // Página atual (default: 1)
  limit?: number;         // Items por página (default: 10, max: 100)
  status?: OrderStatus;   // Filtrar por status (PENDING, PROCESSING, COMPLETED, CANCELLED)
  dateFrom?: string;      // Data inicial (ISO 8601) - ex: 2026-03-01T00:00:00Z
  dateTo?: string;        // Data final (ISO 8601) - ex: 2026-03-31T23:59:59Z
}
```

#### Response 200 (Success)

```json
{
  "data": [
    {
      "id": "623e4567-e89b-12d3-a456-426614174005",
      "orderNumber": "ORD-1710501234567-A3F9",
      "status": "COMPLETED",
      "totalAmount": 24.5,
      "itemsCount": 2,
      "createdAt": "2026-03-15T15:00:00Z",
      "updatedAt": "2026-03-15T16:00:00Z"
    },
    {
      "id": "923e4567-e89b-12d3-a456-426614174008",
      "orderNumber": "ORD-1710501298765-B7K2",
      "status": "PENDING",
      "totalAmount": 15.0,
      "itemsCount": 1,
      "createdAt": "2026-03-15T15:30:00Z",
      "updatedAt": "2026-03-15T15:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 89,
    "totalPages": 9
  }
}
```

#### Response 400 (Bad Request)

```json
{
  "error": "Validation error",
  "details": [
    {
      "field": "status",
      "message": "status must be one of: PENDING, PROCESSING, COMPLETED, CANCELLED"
    }
  ]
}
```

---

## 📋 Padrões de Response

### Paginação

Todos os endpoints de listagem retornam:

```json
{
  "data": [...],
  "meta": {
    "page": 1,           // Página atual
    "limit": 10,         // Items por página
    "total": 120,        // Total de items
    "totalPages": 12     // Total de páginas
  }
}
```

### Erros

Formato padrão de erros:

```json
{
  "error": "Error message",
  "details": [
    {
      "field": "fieldName",
      "message": "Validation message"
    }
  ]
}
```

> ⚠️ **Tratamento de Erros**: Para o contrato completo de erros, hierarquia de exceções e como o handler global funciona, veja [docs/error-handling.md](error-handling.md).

### Status Codes

| Code  | Descrição                                                          |
| ----- | ------------------------------------------------------------------ |
| `200` | Success - GET                                                      |
| `201` | Created - POST                                                     |
| `400` | Bad Request - Validação falhou                                     |
| `404` | Not Found - Recurso não encontrado                                 |
| `409` | Conflict — Recurso duplicado (e-mail ou telefone já cadastrado)    |
| `500` | Internal Server Error - Erro no servidor                           |

---

## 🔒 Autenticação (Futuro)

Em futuras versões, todos os endpoints exigirão autenticação JWT:

```http
Authorization: Bearer <token>
```

---

## 📊 Rate Limiting (Futuro)

Headers de rate limiting:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1710501600
```

---

## 🧪 Exemplos de Uso

### Criar pedido completo

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "323e4567-e89b-12d3-a456-426614174002",
        "quantity": 2
      }
    ]
  }'
```

### Listar produtos de uma categoria

```bash
curl "http://localhost:3000/api/products?categoryId=123e4567-e89b-12d3-a456-426614174000&page=1&limit=20"
```

### Filtrar pedidos por status e período

```bash
curl "http://localhost:3000/api/orders?status=COMPLETED&dateFrom=2026-03-01T00:00:00Z&dateTo=2026-03-31T23:59:59Z"
```

---

[⬆ Voltar para README](../README.md)
