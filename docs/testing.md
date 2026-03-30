# 🧪 Testes

## Visão Geral

O Common Cornershop utiliza **Jest** como framework principal de testes, garantindo qualidade, confiabilidade e manutenibilidade do código através de três tipos de testes: **unitários**, **integração** e **end-to-end (E2E)**.

### Por que Jest?

- ⚡ **Rápido e eficiente** - Zero-config, execução paralela
- 🎯 **Type-safe** - Integração nativa com TypeScript
- 🔍 **Excelente DX** - Watch mode, coverage, snapshots
- 🛠️ **Completo** - Mocking, assertions, spies built-in
- 📊 **Coverage reports** - Relatórios detalhados de cobertura

---

## Tipos de Testes

```mermaid
flowchart LR
    A[Unit Tests] -->|Camadas isoladas| B[Services]
    A -->|Mocks| C[UseCases]

    D[Integration Tests] -->|Banco real| E[Repositories]
    D -->|HTTP| F[Controllers]

    G[E2E Tests] -->|Full stack| H[API Endpoints]

    style A fill:#4ecdc4
    style D fill:#45b7d1
    style G fill:#96ceb4
```

| Tipo            | Escopo                   | Velocidade      | Complexidade | Objetivo                            |
| --------------- | ------------------------ | --------------- | ------------ | ----------------------------------- |
| **Unit**        | Classes/funções isoladas | ⚡ Muito rápida | 🟢 Baixa     | Testar lógica de negócio pura       |
| **Integration** | Múltiplas camadas        | ⚡ Média        | 🟡 Média     | Testar integração entre componentes |
| **E2E**         | Sistema completo         | 🐢 Lenta        | 🔴 Alta      | Testar fluxos completos de usuário  |

---

## Configuração

### Setup do Jest no NX Workspace

#### `jest.config.ts` (raiz do projeto)

```typescript
import { getJestProjects } from '@nx/jest';

export default {
  projects: getJestProjects(),
};
```

#### `apps/api/jest.config.ts`

```typescript
export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.spec.ts',
    '!src/**/*.e2e-spec.ts',
    '!src/main.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
```

#### `apps/api/tsconfig.spec.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "module": "commonjs",
    "types": ["jest", "node"]
  },
  "include": ["src/**/*.spec.ts", "src/**/*.test.ts", "src/**/*.e2e-spec.ts", "src/test/**/*.ts"]
}
```

#### `apps/api/src/test/setup.ts`

```typescript
// Setup global para todos os testes
import 'reflect-metadata';

// Mock de variáveis de ambiente
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/cornershop_test';

// Timeout global para testes (útil para operações de banco)
jest.setTimeout(10000);

// Mock de console para reduzir ruído nos logs
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Manter error e outros métodos críticos
};
```

---

## Estrutura de Testes

### Organização de Arquivos

**Padrão co-located** - Testes ao lado do código que testam:

```
apps/api/src/
├── controllers/
│   ├── product.controller.ts
│   └── product.controller.spec.ts          # Teste de integração
│
libs/domain/src/
├── products/
│   ├── services/
│   │   ├── product-calculation.service.ts
│   │   └── product-calculation.service.spec.ts  # Teste unitário
│   └── use-cases/
│       ├── list-products.usecase.ts
│       └── list-products.usecase.spec.ts    # Teste unitário
│
test/
├── e2e/
│   ├── products.e2e-spec.ts                 # Teste E2E
│   └── orders.e2e-spec.ts
└── fixtures/
    ├── products.fixture.ts                  # Dados de teste
    └── orders.fixture.ts
```

### Nomenclatura de Arquivos

| Tipo                 | Convenção       | Exemplo                      |
| -------------------- | --------------- | ---------------------------- |
| **Unit test**        | `*.spec.ts`     | `product.service.spec.ts`    |
| **Integration test** | `*.spec.ts`     | `product.controller.spec.ts` |
| **E2E test**         | `*.e2e-spec.ts` | `products.e2e-spec.ts`       |

---

## Testes Unitários

### O que Testar em Cada Camada

#### Services (Lógica de Negócio Isolada)

✅ **O que testar:**

- Cálculos e transformações
- Validações de regras de negócio
- Lógica condicional
- Tratamento de erros

❌ **O que NÃO testar:**

- Acesso a banco de dados
- Chamadas HTTP externas
- Operações de I/O

#### UseCases (Orquestração com Mocks)

✅ **O que testar:**

- Fluxo de orquestração
- Chamadas corretas aos services/repositories
- Tratamento de erros
- Validação de inputs

#### Repositories

⚠️ **Geralmente testados como testes de integração** com banco real

---

### Exemplo: Service Test

```typescript
// libs/domain/src/orders/services/order-calculation.service.spec.ts

import { OrderCalculationService } from './order-calculation.service';
import { ProductNotFoundException } from '../../errors/product-not-found.error';

describe('OrderCalculationService', () => {
  let service: OrderCalculationService;

  beforeEach(() => {
    service = new OrderCalculationService();
  });

  describe('calculateOrderItems', () => {
    it('should calculate order items correctly with valid products', () => {
      // Arrange
      const items = [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 1 },
      ];

      const products = [
        { id: 'prod-1', name: 'Product 1', price: 10 },
        { id: 'prod-2', name: 'Product 2', price: 15 },
      ];

      // Act
      const result = service.calculateOrderItems(items, products);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 10,
        subtotal: 20,
      });
      expect(result[1]).toEqual({
        productId: 'prod-2',
        quantity: 1,
        unitPrice: 15,
        subtotal: 15,
      });
    });

    it('should throw ProductNotFoundException when product is not found', () => {
      // Arrange
      const items = [{ productId: 'invalid-id', quantity: 1 }];
      const products = [];

      // Act & Assert
      expect(() => service.calculateOrderItems(items, products)).toThrow(ProductNotFoundException);
    });
  });

  describe('calculateTotal', () => {
    it('should calculate total amount correctly with multiple items', () => {
      // Arrange
      const items = [
        { productId: '1', quantity: 2, unitPrice: 10, subtotal: 20 },
        { productId: '2', quantity: 1, unitPrice: 15, subtotal: 15 },
      ];

      // Act
      const total = service.calculateTotal(items);

      // Assert
      expect(total).toBe(35);
    });

    it('should return 0 for empty items array', () => {
      // Arrange
      const items = [];

      // Act
      const total = service.calculateTotal(items);

      // Assert
      expect(total).toBe(0);
    });
  });
});
```

---

### Exemplo: UseCase Test com Mocks

```typescript
// libs/domain/src/orders/use-cases/create-order.usecase.spec.ts

import { CreateOrderUseCase } from './create-order.usecase';
import { IProductRepository } from '../../repositories/product.repository';
import { IOrderRepository } from '../../repositories/order.repository';
import { OrderCalculationService } from '../services/order-calculation.service';
import { InsufficientStockError } from '../../errors/insufficient-stock.error';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockCalculationService: jest.Mocked<OrderCalculationService>;

  beforeEach(() => {
    // Criar mocks
    mockProductRepository = {
      findById: jest.fn(),
      findByIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    mockOrderRepository = {
      create: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockCalculationService = {
      calculateOrderItems: jest.fn(),
      calculateTotal: jest.fn(),
    } as any;

    // Instanciar usecase com mocks
    useCase = new CreateOrderUseCase(
      mockProductRepository,
      mockOrderRepository,
      mockCalculationService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create order successfully with valid items', async () => {
      // Arrange
      const input = {
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 },
        ],
      };

      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', price: 10, stock: { quantity: 10 } },
        { id: 'prod-2', name: 'Product 2', price: 15, stock: { quantity: 5 } },
      ];

      const calculatedItems = [
        { productId: 'prod-1', quantity: 2, unitPrice: 10, subtotal: 20 },
        { productId: 'prod-2', quantity: 1, unitPrice: 15, subtotal: 15 },
      ];

      const mockOrder = {
        id: 'order-123',
        items: calculatedItems,
        totalAmount: 35,
        status: 'PENDING',
      };

      // Setup mocks
      mockProductRepository.findByIds.mockResolvedValue(mockProducts);
      mockCalculationService.calculateOrderItems.mockReturnValue(calculatedItems);
      mockCalculationService.calculateTotal.mockReturnValue(35);
      mockOrderRepository.create.mockResolvedValue(mockOrder);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(mockProductRepository.findByIds).toHaveBeenCalledWith(['prod-1', 'prod-2']);
      expect(mockCalculationService.calculateOrderItems).toHaveBeenCalledWith(
        input.items,
        mockProducts,
      );
      expect(mockCalculationService.calculateTotal).toHaveBeenCalledWith(calculatedItems);
      expect(mockOrderRepository.create).toHaveBeenCalledWith({
        items: calculatedItems,
        totalAmount: 35,
      });
      expect(result).toEqual(mockOrder);
    });

    it('should throw InsufficientStockError when product stock is insufficient', async () => {
      // Arrange
      const input = {
        items: [{ productId: 'prod-1', quantity: 100 }],
      };

      const mockProducts = [{ id: 'prod-1', name: 'Product 1', price: 10, stock: { quantity: 5 } }];

      mockProductRepository.findByIds.mockResolvedValue(mockProducts);

      // Act & Assert
      await expect(useCase.execute(input)).rejects.toThrow(InsufficientStockError);
    });
  });
});
```

---

## Testes de Integração

### Testando Repositories com TypeORM Real

```typescript
// apps/api/src/repositories/product.repository.impl.spec.ts

import { DataSource } from 'typeorm';
import { ProductRepositoryImpl } from './product.repository.impl';
import { ProductEntity } from '../database/entities/product.entity';
import { CategoryEntity } from '../database/entities/category.entity';

describe('ProductRepositoryImpl (Integration)', () => {
  let dataSource: DataSource;
  let repository: ProductRepositoryImpl;

  beforeAll(async () => {
    // Setup banco de dados de teste
    dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'test',
      password: 'test',
      database: 'cornershop_test',
      entities: [ProductEntity, CategoryEntity],
      synchronize: true, // Apenas para testes
    });

    await dataSource.initialize();
    repository = new ProductRepositoryImpl(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // Limpar tabelas antes de cada teste
    await dataSource.getRepository(ProductEntity).clear();
    await dataSource.getRepository(CategoryEntity).clear();
  });

  describe('findById', () => {
    it('should return product with relations when found', async () => {
      // Arrange
      const categoryRepo = dataSource.getRepository(CategoryEntity);
      const category = await categoryRepo.save({
        name: 'Beverages',
        description: 'Drinks',
      });

      const productRepo = dataSource.getRepository(ProductEntity);
      const product = await productRepo.save({
        name: 'Coca Cola',
        price: 5.5,
        categoryId: category.id,
        isActive: true,
      });

      // Act
      const result = await repository.findById(product.id);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(product.id);
      expect(result?.name).toBe('Coca Cola');
      expect(result?.category).toBeDefined();
      expect(result?.category.name).toBe('Beverages');
    });

    it('should return null when product not found', async () => {
      // Act
      const result = await repository.findById('non-existent-id');

      // Assert
      expect(result).toBeNull();
    });

    it('should not return soft-deleted products', async () => {
      // Arrange
      const productRepo = dataSource.getRepository(ProductEntity);
      const product = await productRepo.save({
        name: 'Deleted Product',
        price: 10,
        categoryId: 'cat-1',
        deletedAt: new Date(),
      });

      // Act
      const result = await repository.findById(product.id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return paginated products with correct meta', async () => {
      // Arrange
      const categoryRepo = dataSource.getRepository(CategoryEntity);
      const category = await categoryRepo.save({ name: 'Test Category' });

      const productRepo = dataSource.getRepository(ProductEntity);
      await productRepo.save([
        { name: 'Product 1', price: 10, categoryId: category.id, isActive: true },
        { name: 'Product 2', price: 20, categoryId: category.id, isActive: true },
        { name: 'Product 3', price: 30, categoryId: category.id, isActive: true },
      ]);

      // Act
      const result = await repository.findAll({ page: 1, limit: 2 });

      // Assert
      expect(result.data).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
    });

    it('should filter by categoryId correctly', async () => {
      // Arrange
      const categoryRepo = dataSource.getRepository(CategoryEntity);
      const [cat1, cat2] = await categoryRepo.save([
        { name: 'Category 1' },
        { name: 'Category 2' },
      ]);

      const productRepo = dataSource.getRepository(ProductEntity);
      await productRepo.save([
        { name: 'Product in Cat1', price: 10, categoryId: cat1.id },
        { name: 'Product in Cat2', price: 20, categoryId: cat2.id },
      ]);

      // Act
      const result = await repository.findAll({ categoryId: cat1.id });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('Product in Cat1');
    });
  });
});
```

---

### Testando Controllers com Fastify Inject

```typescript
// apps/api/src/controllers/product.controller.spec.ts

import Fastify, { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';
import { ProductController } from './product.controller';
import { IProductRepository } from '@domain/repositories/product.repository';

describe('ProductController (Integration)', () => {
  let app: FastifyInstance;
  let mockProductRepository: jest.Mocked<IProductRepository>;

  beforeAll(async () => {
    // Setup Fastify app
    app = Fastify();

    // Mock repository
    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
    } as any;

    // Register mock in DI container
    container.registerInstance('IProductRepository', mockProductRepository);

    // Register routes
    const controller = new ProductController();
    app.get('/api/products', controller.list.bind(controller));
    app.get('/api/products/:id', controller.getById.bind(controller));

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return paginated products with 200 status', async () => {
      // Arrange
      const mockResponse = {
        data: [
          { id: '1', name: 'Product 1', price: 10 },
          { id: '2', name: 'Product 2', price: 20 },
        ],
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      };

      mockProductRepository.findAll.mockResolvedValue(mockResponse);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/products?page=1&limit=10',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockResponse);
      expect(mockProductRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });

    it('should filter by categoryId when provided', async () => {
      // Arrange
      mockProductRepository.findAll.mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      // Act
      await app.inject({
        method: 'GET',
        url: '/api/products?categoryId=cat-123',
      });

      // Assert
      expect(mockProductRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId: 'cat-123' }),
      );
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product with 200 status when found', async () => {
      // Arrange
      const mockProduct = { id: 'prod-1', name: 'Product 1', price: 10 };
      mockProductRepository.findById.mockResolvedValue(mockProduct);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/prod-1',
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual(mockProduct);
    });

    it('should return 404 when product not found', async () => {
      // Arrange
      mockProductRepository.findById.mockResolvedValue(null);

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/products/invalid-id',
      });

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({ error: 'Product not found' });
    });
  });
});
```

---

## Testes E2E (End-to-End)

### Setup de Ambiente Isolado

```typescript
// test/e2e/setup.ts

import { DataSource } from 'typeorm';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class E2ETestSetup {
  private static dataSource: DataSource;

  static async setup(): Promise<DataSource> {
    // Executar migrations no banco de teste
    await execAsync('yarn migration:run:test');

    // Criar DataSource
    this.dataSource = new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      username: 'test',
      password: 'test',
      database: 'cornershop_test',
      entities: ['src/database/entities/**/*.entity.ts'],
      synchronize: false,
    });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  static async teardown(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
    }
  }

  static async clearDatabase(): Promise<void> {
    const entities = this.dataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = this.dataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
}
```

---

### Exemplo: E2E Test Completo

```typescript
// test/e2e/orders.e2e-spec.ts

import { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { createApp } from '../../apps/api/src/app';
import { E2ETestSetup } from './setup';
import { CategoryEntity } from '../../apps/api/src/database/entities/category.entity';
import { ProductEntity } from '../../apps/api/src/database/entities/product.entity';
import { StockEntity } from '../../apps/api/src/database/entities/stock.entity';

describe('Orders API (E2E)', () => {
  let app: FastifyInstance;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await E2ETestSetup.setup();
    app = await createApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await E2ETestSetup.teardown();
  });

  beforeEach(async () => {
    await E2ETestSetup.clearDatabase();
  });

  describe('POST /api/orders', () => {
    it('should create order successfully with valid products', async () => {
      // Arrange - Setup database state
      const categoryRepo = dataSource.getRepository(CategoryEntity);
      const category = await categoryRepo.save({
        name: 'Beverages',
        description: 'Drinks',
      });

      const productRepo = dataSource.getRepository(ProductEntity);
      const [product1, product2] = await productRepo.save([
        {
          name: 'Coca Cola',
          price: 5.5,
          categoryId: category.id,
          isActive: true,
        },
        {
          name: 'Pepsi',
          price: 5.0,
          categoryId: category.id,
          isActive: true,
        },
      ]);

      const stockRepo = dataSource.getRepository(StockEntity);
      await stockRepo.save([
        { productId: product1.id, quantity: 100, minimumQuantity: 10 },
        { productId: product2.id, quantity: 50, minimumQuantity: 5 },
      ]);

      const orderPayload = {
        items: [
          { productId: product1.id, quantity: 2 },
          { productId: product2.id, quantity: 1 },
        ],
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderPayload,
      });

      // Assert
      expect(response.statusCode).toBe(201);

      const responseBody = response.json();
      expect(responseBody).toMatchObject({
        id: expect.any(String),
        status: 'PENDING',
        totalAmount: 16.0, // (5.5 * 2) + (5.0 * 1)
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: product1.id,
            quantity: 2,
            unitPrice: 5.5,
            subtotal: 11.0,
          }),
          expect.objectContaining({
            productId: product2.id,
            quantity: 1,
            unitPrice: 5.0,
            subtotal: 5.0,
          }),
        ]),
        createdAt: expect.any(String),
      });

      // Verificar que o estoque foi atualizado
      const updatedStock1 = await stockRepo.findOne({
        where: { productId: product1.id },
      });
      const updatedStock2 = await stockRepo.findOne({
        where: { productId: product2.id },
      });

      expect(updatedStock1?.quantity).toBe(98);
      expect(updatedStock2?.quantity).toBe(49);
    });

    it('should return 400 when product has insufficient stock', async () => {
      // Arrange
      const categoryRepo = dataSource.getRepository(CategoryEntity);
      const category = await categoryRepo.save({ name: 'Test Category' });

      const productRepo = dataSource.getRepository(ProductEntity);
      const product = await productRepo.save({
        name: 'Low Stock Product',
        price: 10,
        categoryId: category.id,
        isActive: true,
      });

      const stockRepo = dataSource.getRepository(StockEntity);
      await stockRepo.save({
        productId: product.id,
        quantity: 2, // Estoque baixo
        minimumQuantity: 1,
      });

      const orderPayload = {
        items: [{ productId: product.id, quantity: 10 }], // Quantidade maior que estoque
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderPayload,
      });

      // Assert
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        error: 'InsufficientStockError',
        message: expect.stringContaining('insufficient stock'),
      });
    });

    it('should return 404 when product does not exist', async () => {
      // Arrange
      const orderPayload = {
        items: [{ productId: 'non-existent-id', quantity: 1 }],
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: orderPayload,
      });

      // Assert
      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({
        error: 'ProductNotFoundException',
      });
    });

    it('should return 400 for invalid payload', async () => {
      // Arrange
      const invalidPayload = {
        items: [
          { productId: 'invalid', quantity: -5 }, // Quantidade negativa
        ],
      };

      // Act
      const response = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: invalidPayload,
      });

      // Assert
      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order with all details', async () => {
      // Arrange - Criar ordem completa no banco
      const categoryRepo = dataSource.getRepository(CategoryEntity);
      const category = await categoryRepo.save({ name: 'Food' });

      const productRepo = dataSource.getRepository(ProductEntity);
      const product = await productRepo.save({
        name: 'Pizza',
        price: 25.0,
        categoryId: category.id,
        isActive: true,
      });

      // Criar ordem via API
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/orders',
        payload: {
          items: [{ productId: product.id, quantity: 1 }],
        },
      });

      const { id: orderId } = createResponse.json();

      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/api/orders/${orderId}`,
      });

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        id: orderId,
        status: 'PENDING',
        totalAmount: 25.0,
        items: [
          {
            productId: product.id,
            quantity: 1,
            unitPrice: 25.0,
            subtotal: 25.0,
            product: {
              id: product.id,
              name: 'Pizza',
            },
          },
        ],
      });
    });

    it('should return 404 when order not found', async () => {
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/api/orders/non-existent-id',
      });

      // Assert
      expect(response.statusCode).toBe(404);
    });
  });
});
```

---

## Mocking e Stubs

### Como Mockar TSyringe Dependencies

```typescript
import { container } from 'tsyringe';

// Mock de repositório
const mockProductRepository = {
  findById: jest.fn(),
  findAll: jest.fn(),
  create: jest.fn(),
};

// Registrar mock no container antes dos testes
container.registerInstance('IProductRepository', mockProductRepository);

// Limpar container após testes
afterAll(() => {
  container.clearInstances();
});
```

---

### Mock de Repositórios com @golevelup/ts-jest

```typescript
import { createMock } from '@golevelup/ts-jest';
import { IProductRepository } from '@domain/repositories/product.repository';

describe('UseCase with auto-mocked repository', () => {
  let mockRepository: IProductRepository;

  beforeEach(() => {
    // Cria mock automático com todos os métodos
    mockRepository = createMock<IProductRepository>();
  });

  it('should work with auto-generated mocks', async () => {
    // Arrange
    mockRepository.findById = jest.fn().mockResolvedValue({
      id: '1',
      name: 'Product',
    });

    // Act & Assert
    const result = await mockRepository.findById('1');
    expect(result?.name).toBe('Product');
  });
});
```

---

### Mock de Serviços Externos

```typescript
// libs/domain/src/notifications/email.service.ts
export class EmailService {
  async sendOrderConfirmation(orderId: string, email: string): Promise<void> {
    // Integração com serviço externo
  }
}

// test
jest.mock('@domain/notifications/email.service');

describe('CreateOrderUseCase with external service', () => {
  let mockEmailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    mockEmailService = {
      sendOrderConfirmation: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  it('should send email confirmation after order creation', async () => {
    // Arrange
    const useCase = new CreateOrderUseCase(
      mockOrderRepository,
      mockEmailService
    );

    // Act
    await useCase.execute({ items: [...] });

    // Assert
    expect(mockEmailService.sendOrderConfirmation).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String)
    );
  });
});
```

---

## Coverage (Cobertura)

### Metas de Cobertura

```typescript
// jest.config.ts
coverageThreshold: {
  global: {
    branches: 70,    // 70% das ramificações (if/else)
    functions: 80,   // 80% das funções
    lines: 80,       // 80% das linhas
    statements: 80,  // 80% dos statements
  },
  // Metas específicas por arquivo/diretório
  './libs/domain/src/**/*.service.ts': {
    branches: 80,
    functions: 90,
    lines: 90,
    statements: 90,
  },
};
```

---

### Resultados recentes (T5.1 / T5.2)

As tasks T5.1 (Unit Tests: Domain Services) e T5.2 (Unit Tests: UseCases) foram concluídas. Os artefatos de teste e relatórios mostram cobertura alinhada com as metas para as áreas críticas (linhas e funções):

| Área                                 |  Lines | Functions | Observação                   |
| ------------------------------------ | -----: | --------: | ---------------------------- |
| Services (libs/domain/src/services)  | >= 90% |    >= 90% | Meta atingida — entrega T5.1 |
| UseCases (libs/domain/src/use-cases) | >= 80% |    >= 80% | Meta atingida — entrega T5.2 |

Cobertura atual aproximada (exemplo de execução):

```
All files                 |   86-90%  (varia por execução)
services                 |   >= 90%
use-cases                |   >= 80%
```

Essas entregas estão referenciadas nas tasks T5.1 e T5.2 no roadmap e podem ser verificadas gerando o relatório completo com `yarn test:coverage`.

---

### Gerar Relatórios de Cobertura

```bash
# Executar testes com cobertura
yarn test:coverage

# Relatório será gerado em: coverage/
# Abrir relatório HTML
open coverage/lcov-report/index.html
```

**Formato do relatório (exemplo):**

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   85.23 |    78.45 |   90.12 |   86.34 |
 services                 |   92.11 |    88.23 |   95.45 |   93.67 |
  order-calculation.ts    |   95.67 |    92.11 |   100   |   96.23 |
  product-pricing.ts      |   88.45 |    84.12 |   90.91 |   90.45 |
 use-cases                |   78.23 |    68.34 |   85.11 |   80.12 |
  create-order.ts         |   82.34 |    72.45 |   88.89 |   84.56 |
--------------------------|---------|----------|---------|---------|
```

---

### Integração com CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: cornershop_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Run unit tests
        run: yarn test:unit

      - name: Run integration tests
        run: yarn test:integration

      - name: Run E2E tests
        run: yarn test:e2e

      - name: Generate coverage report
        run: yarn test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Check coverage threshold
        run: yarn test:coverage --passWithNoTests
```

---

## Boas Práticas

### 1. Arrange-Act-Assert (AAA) Pattern

```typescript
it('should calculate discount correctly', () => {
  // Arrange - Preparar dados e dependências
  const price = 100;
  const discountPercent = 10;
  const service = new PricingService();

  // Act - Executar ação a ser testada
  const result = service.calculateDiscount(price, discountPercent);

  // Assert - Verificar resultado esperado
  expect(result).toBe(90);
});
```

---

### 2. Testes Devem Ser Independentes

❌ **Errado - Testes acoplados:**

```typescript
describe('OrderService', () => {
  let orderId: string; // Estado compartilhado

  it('should create order', async () => {
    orderId = await service.create({ items: [...] });
    expect(orderId).toBeDefined();
  });

  it('should get order by id', async () => {
    const order = await service.getById(orderId); // Depende do teste anterior
    expect(order).toBeDefined();
  });
});
```

✅ **Correto - Testes independentes:**

```typescript
describe('OrderService', () => {
  it('should create order', async () => {
    const orderId = await service.create({ items: [...] });
    expect(orderId).toBeDefined();
  });

  it('should get order by id', async () => {
    // Setup próprio
    const orderId = await service.create({ items: [...] });

    const order = await service.getById(orderId);
    expect(order).toBeDefined();
  });
});
```

---

### 3. Evitar Testes Frágeis

❌ **Errado - Teste frágil (depende de ordem):**

```typescript
it('should return products in order', () => {
  const products = service.listProducts();
  expect(products[0].name).toBe('Product A');
  expect(products[1].name).toBe('Product B');
});
```

✅ **Correto - Teste resiliente:**

```typescript
it('should return all products', () => {
  const products = service.listProducts();

  expect(products).toHaveLength(2);
  expect(products).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ name: 'Product A' }),
      expect.objectContaining({ name: 'Product B' }),
    ]),
  );
});
```

---

### 4. Usar describe/it Descritivos

✅ **Bom:**

```typescript
describe('OrderCalculationService', () => {
  describe('calculateTotal', () => {
    it('should return 0 for empty order', () => { ... });
    it('should sum all item subtotals correctly', () => { ... });
    it('should handle decimal precision correctly', () => { ... });
  });

  describe('calculateDiscount', () => {
    it('should apply percentage discount correctly', () => { ... });
    it('should throw error for negative discount', () => { ... });
  });
});
```

---

### 5. Setup e Teardown Adequados

```typescript
describe('ProductRepository', () => {
  let dataSource: DataSource;
  let repository: ProductRepository;

  // Executado UMA vez antes de todos os testes
  beforeAll(async () => {
    dataSource = await createTestDataSource();
    repository = new ProductRepository(dataSource);
  });

  // Executado UMA vez após todos os testes
  afterAll(async () => {
    await dataSource.destroy();
  });

  // Executado ANTES de cada teste
  beforeEach(async () => {
    await clearDatabase(dataSource);
  });

  // Executado APÓS cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('test 1', () => { ... });
  it('test 2', () => { ... });
});
```

---

### 6. Fixtures e Factories para Dados de Teste

```typescript
// test/fixtures/product.fixture.ts

export class ProductFixture {
  static createProduct(overrides?: Partial<Product>): Product {
    return {
      id: 'prod-' + Math.random().toString(36).substr(2, 9),
      name: 'Test Product',
      price: 10.0,
      categoryId: 'cat-123',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  static createProducts(count: number): Product[] {
    return Array.from({ length: count }, (_, i) =>
      this.createProduct({ name: `Product ${i + 1}` }),
    );
  }
}

// Uso
it('should list products', () => {
  const products = ProductFixture.createProducts(5);
  mockRepository.findAll.mockResolvedValue(products);

  // Test logic...
});
```

---

## Scripts de Teste

### `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern='\\.spec\\.ts$' --testPathIgnorePatterns='e2e'",
    "test:integration": "jest --testPathPattern='repository.*\\.spec\\.ts$|controller.*\\.spec\\.ts$'",
    "test:e2e": "jest --testPathPattern='\\.e2e-spec\\.ts$'",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:coverage:unit": "jest --coverage --testPathPattern='\\.spec\\.ts$' --testPathIgnorePatterns='e2e'",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:affected": "nx affected:test"
  }
}
```

---

### Comandos Principais

```bash
# Executar todos os testes
yarn test

# Apenas testes unitários (rápido)
yarn test:unit

# Apenas testes de integração
yarn test:integration

# Apenas testes E2E (lento)
yarn test:e2e

# Watch mode (re-executa ao modificar código)
yarn test:watch

# Gerar relatório de cobertura
yarn test:coverage

# Debug de testes (com breakpoints)
yarn test:debug

# Testes afetados por mudanças (NX)
yarn nx affected:test
```

---

### Scripts Avançados

```bash
# Executar teste específico por nome
yarn test -t "should calculate total"

# Executar apenas testes de um arquivo
yarn test src/services/order-calculation.service.spec.ts

# Executar testes em modo silencioso
yarn test --silent

# Ver apenas testes que falharam
yarn test --onlyFailures

# Atualizar snapshots
yarn test -u

# Listar todos os testes sem executá-los
yarn test --listTests
```

---

## Ferramentas Complementares

### @faker-js/faker

Geração de dados falsos realistas:

```bash
yarn add -D @faker-js/faker
```

```typescript
import { faker } from '@faker-js/faker';

export class ProductFactory {
  static create(): Product {
    return {
      id: faker.string.uuid(),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      description: faker.commerce.productDescription(),
      categoryId: faker.string.uuid(),
      isActive: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}
```

---

### @golevelup/ts-jest

Mocking avançado para TSyringe:

```bash
yarn add -D @golevelup/ts-jest
```

```typescript
import { createMock } from '@golevelup/ts-jest';
import { IProductRepository } from '@domain/repositories/product.repository';

const mockRepository = createMock<IProductRepository>();
```

---

### Fastify Inject

Testes HTTP sem subir servidor:

```typescript
import Fastify from 'fastify';

const app = Fastify();

// Registrar rotas...

const response = await app.inject({
  method: 'POST',
  url: '/api/orders',
  payload: { items: [...] },
  headers: {
    'Content-Type': 'application/json',
  },
});

expect(response.statusCode).toBe(201);
```

---

### Supertest (Alternativa ao Fastify Inject)

```bash
yarn add -D supertest @types/supertest
```

```typescript
import request from 'supertest';

describe('Orders API', () => {
  it('should create order', async () => {
    const response = await request(app.server)
      .post('/api/orders')
      .send({ items: [...] })
      .expect(201);

    expect(response.body).toMatchObject({
      id: expect.any(String),
      status: 'PENDING',
    });
  });
});
```

---

## Estrutura de Testes Recomendada

```
apps/api/
├── src/
│   ├── controllers/
│   │   ├── product.controller.ts
│   │   └── product.controller.spec.ts        # Integration test
│   ├── repositories/
│   │   ├── product.repository.impl.ts
│   │   └── product.repository.impl.spec.ts   # Integration test
│   └── test/
│       └── setup.ts                           # Global setup

libs/domain/src/
├── products/
│   ├── services/
│   │   ├── product-pricing.service.ts
│   │   └── product-pricing.service.spec.ts   # Unit test
│   └── use-cases/
│       ├── list-products.usecase.ts
│       └── list-products.usecase.spec.ts     # Unit test

test/
├── e2e/
│   ├── products.e2e-spec.ts                  # E2E test
│   ├── orders.e2e-spec.ts                    # E2E test
│   └── setup.ts                               # E2E setup
├── fixtures/
│   ├── products.fixture.ts                    # Test data
│   └── orders.fixture.ts
└── factories/
    ├── product.factory.ts                     # Data builders
    └── order.factory.ts
```

---

## Checklist de Qualidade de Testes

✅ **Cobertura**

- [ ] Cobertura de linhas >= 80%
- [ ] Cobertura de branches >= 70%
- [ ] Casos de erro testados

✅ **Independência**

- [ ] Testes podem rodar em qualquer ordem
- [ ] Cada teste tem seu próprio setup
- [ ] Sem estado compartilhado entre testes

✅ **Clareza**

- [ ] Nomes descritivos (describe/it)
- [ ] Padrão AAA seguido
- [ ] Um conceito por teste

✅ **Manutenibilidade**

- [ ] Fixtures/factories para dados de teste
- [ ] Mocks bem isolados
- [ ] Testes não são frágeis

✅ **Performance**

- [ ] Testes unitários < 100ms
- [ ] Testes de integração < 1s
- [ ] E2E < 10s por cenário

---

## Debugging de Testes

### VS Code Launch Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${fileBasename}", "--config", "jest.config.ts", "--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Jest: All Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

---

### Logs Durante Testes

```typescript
// Habilitar logs temporariamente
it('should do something', () => {
  console.log('Debug info:', someVariable); // Will show in test output

  // Ou usar o --verbose flag
  // yarn test --verbose
});
```

---

## Próximos Passos

### Melhorias Futuras

- [ ] **Mutation Testing** - Stryker para validar qualidade dos testes
- [ ] **Visual Regression Testing** - Percy ou Chromatic (se houver UI)
- [ ] **Contract Testing** - Pact para testes de contrato entre serviços
- [ ] **Load Testing** - k6 ou Artillery para testes de carga
- [ ] **Test Orchestration** - Testcontainers para ambientes isolados

---

## Recursos Adicionais

### Links Úteis

- [Jest Official Docs](https://jestjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Effective Unit Testing](https://martinfowler.com/bliki/UnitTest.html)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

### Livros Recomendados

- **"Test Driven Development: By Example"** - Kent Beck
- **"Growing Object-Oriented Software, Guided by Tests"** - Steve Freeman
- **"Unit Testing Principles, Practices, and Patterns"** - Vladimir Khorikov

---

[⬆ Voltar para README](../README.md)
