# 🎨 Convenções e Padrões

## Nomenclatura de Código

### Regra Geral

**100% em inglês** - Todo código, variáveis, funções, classes e comentários devem ser em inglês.

### Tabela de Padrões

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| **Variáveis/Funções** | `camelCase` | `productService`, `getUserById`, `isActive` |
| **Classes/Interfaces/Types** | `PascalCase` | `ProductService`, `IProductRepository`, `CreateOrderDTO` |
| **Constantes** | `UPPER_SNAKE_CASE` | `MAX_RETRY_ATTEMPTS`, `DEFAULT_PAGE_SIZE` |
| **Arquivos** | `kebab-case` | `product.service.ts`, `order-item.entity.ts` |
| **Diretórios** | `kebab-case` | `order-items/`, `use-cases/`, `database/` |
| **Tabelas (DB)** | `snake_case` | `order_items`, `product_categories` |
| **Colunas (DB)** | `snake_case` | `unit_price`, `created_at`, `is_active` |
| **Enums** | Nome: `PascalCase`<br>Valores: `UPPER_SNAKE_CASE` | `OrderStatus.PENDING` |

---

## Conventional Commits

Commits seguem o padrão [Conventional Commits](https://www.conventionalcommits.org/) em inglês.

### Formato

```bash
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Tipos

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova funcionalidade | `feat(orders): add order creation endpoint` |
| `fix` | Correção de bug | `fix(stock): resolve negative quantity validation` |
| `docs` | Mudanças em documentação | `docs: update API documentation` |
| `style` | Formatação, missing semi colons, etc | `style: format code with prettier` |
| `refactor` | Refatoração de código | `refactor(products): extract price calculation to service` |
| `test` | Adição ou correção de testes | `test(categories): add unit tests for category service` |
| `chore` | Tarefas de manutenção, build, etc | `chore: update dependencies` |
| `perf` | Melhorias de performance | `perf(orders): optimize query with index` |
| `ci` | Mudanças em CI/CD | `ci: add GitHub Actions workflow` |

### Exemplos Completos

```bash
# Feature simples
feat(orders): add order creation endpoint

# Fix com descrição detalhada
fix(stock): resolve negative quantity validation

The stock quantity was allowing negative values when processing
orders with insufficient stock.

Closes #123

# Breaking change
feat(api)!: change response format for pagination

BREAKING CHANGE: The pagination response now uses 'meta' instead of 'pagination'
```

### Scopes Comuns

- `orders` - Módulo de pedidos
- `products` - Módulo de produtos
- `categories` - Módulo de categorias
- `stock` - Módulo de estoque
- `api` - Camada de apresentação
- `domain` - Camada de domínio
- `database` - Migrations, seeds, queries
- `tests` - Infraestrutura de testes

---

## Estrutura de Código

### Controllers

```typescript
// apps/api/src/controllers/product.controller.ts

/**
 * Controller responsible for product-related HTTP endpoints
 */
export class ProductController {
  constructor(
    @inject('ListProductsUseCase') private listProductsUseCase: IListProductsUseCase,
    @inject('GetProductByIdUseCase') private getProductByIdUseCase: IGetProductByIdUseCase
  ) {}

  /**
   * List products with pagination and filters
   * GET /api/products
   */
  async list(request: FastifyRequest, reply: FastifyReply) {
    const { page, limit, categoryId } = request.query;
    const result = await this.listProductsUseCase.execute({ page, limit, categoryId });
    return reply.code(200).send(result);
  }

  /**
   * Get product by ID with stock information
   * GET /api/products/:id
   */
  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params;
    const product = await this.getProductByIdUseCase.execute(id);
    
    if (!product) {
      return reply.code(404).send({ error: 'Product not found' });
    }
    
    return reply.code(200).send(product);
  }
}
```

### UseCases

```typescript
// libs/domain/src/products/use-cases/list-products.usecase.ts

/**
 * Use case for listing products with pagination and filters
 */
export class ListProductsUseCase implements IListProductsUseCase {
  constructor(
    @inject('IProductRepository') private productRepository: IProductRepository
  ) {}

  /**
   * Execute the list products use case
   * @param params - Pagination and filter parameters
   * @returns Paginated list of products
   */
  async execute(params: ListProductsParams): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10, categoryId, isActive } = params;
    
    return this.productRepository.findAll({
      page,
      limit,
      categoryId,
      isActive,
    });
  }
}
```

### Services

```typescript
// libs/domain/src/orders/services/order-calculation.service.ts

/**
 * Service responsible for order calculations
 */
export class OrderCalculationService {
  /**
   * Calculate order items with unit price and subtotal
   */
  calculateOrderItems(
    items: OrderItemInput[],
    products: Product[]
  ): OrderItemData[] {
    return items.map(item => {
      const product = products.find(p => p.id === item.productId);
      
      if (!product) {
        throw new ProductNotFoundException(item.productId);
      }
      
      const unitPrice = product.price;
      const subtotal = unitPrice * item.quantity;

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      };
    });
  }

  /**
   * Calculate total amount from order items
   */
  calculateTotal(items: OrderItemData[]): number {
    return items.reduce((sum, item) => sum + item.subtotal, 0);
  }
}
```

### Repository Interfaces

```typescript
// libs/domain/src/repositories/product.repository.ts

/**
 * Repository interface for Product entity
 */
export interface IProductRepository {
  /**
   * Find all products with pagination and filters
   */
  findAll(params: FindAllParams): Promise<PaginatedResult<Product>>;
  
  /**
   * Find product by ID
   */
  findById(id: string): Promise<Product | null>;
  
  /**
   * Find multiple products by IDs
   */
  findByIds(ids: string[]): Promise<Product[]>;
  
  /**
   * Create new product
   */
  create(data: CreateProductData): Promise<Product>;
  
  /**
   * Update product
   */
  update(id: string, data: UpdateProductData): Promise<Product>;
  
  /**
   * Soft delete product
   */
  softDelete(id: string): Promise<void>;
}
```

### Repository Implementations

```typescript
// apps/api/src/repositories/product.repository.impl.ts

/**
 * TypeORM implementation of IProductRepository
 */
@injectable()
export class ProductRepositoryImpl implements IProductRepository {
  constructor(
    @inject('DataSource') private dataSource: DataSource
  ) {}

  async findAll(params: FindAllParams): Promise<PaginatedResult<Product>> {
    const { page = 1, limit = 10, categoryId, isActive } = params;
    const skip = (page - 1) * limit;
    
    const repository = this.dataSource.getRepository(ProductEntity);
    const queryBuilder = repository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.deletedAt IS NULL');
    
    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId });
    }
    
    if (isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', { isActive });
    }
    
    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Product | null> {
    const repository = this.dataSource.getRepository(ProductEntity);
    return repository.findOne({
      where: { id, deletedAt: null },
      relations: ['category', 'stock'],
    });
  }

  // ... outras implementações
}
```

### Entities

```typescript
// libs/domain/src/entities/product.entity.ts

/**
 * Product domain entity
 */
@Entity('products')
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations
  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @OneToOne(() => Stock, stock => stock.product)
  stock: Stock;

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems: OrderItem[];
}
```

---

## Nomenclatura de Arquivos

### Padrão Geral

```
{nome}.{tipo}.{extensão}

Exemplos:
product.entity.ts
product.repository.ts
product.repository.impl.ts
list-products.usecase.ts
product-calculation.service.ts
product.controller.ts
product.schema.ts
```

### Tipos de Arquivo

| Sufixo | Descrição |
|--------|-----------|
| `.entity.ts` | Entidade de domínio |
| `.repository.ts` | Interface de repositório |
| `.repository.impl.ts` | Implementação de repositório |
| `.usecase.ts` | Caso de uso |
| `.service.ts` | Serviço de negócio |
| `.controller.ts` | Controller HTTP |
| `.schema.ts` | Schema de validação (Zod) |
| `.dto.ts` | Data Transfer Object |
| `.enum.ts` | Enum |
| `.interface.ts` | Interface TypeScript |
| `.type.ts` | Type alias TypeScript |
| `.spec.ts` | Teste unitário |
| `.e2e-spec.ts` | Teste end-to-end |

---

## Organização de Imports

```typescript
// 1. External dependencies
import { injectable, inject } from 'tsyringe';
import { Entity, Column, ManyToOne } from 'typeorm';

// 2. Internal domain/shared
import { Product } from '@domain/entities/product.entity';
import { IProductRepository } from '@domain/repositories/product.repository';

// 3. Relative imports (same module)
import { ProductCalculationService } from './product-calculation.service';
import { ProductValidator } from './product.validator';
```

---

## Comentários e Documentação

### JSDoc para funções públicas

```typescript
/**
 * Calculate discount for product based on percentage
 * @param price - Original product price
 * @param discountPercent - Discount percentage (0-100)
 * @returns Discounted price
 * @throws {InvalidDiscountError} If discount percent is invalid
 */
calculateDiscount(price: number, discountPercent: number): number {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new InvalidDiscountError(discountPercent);
  }
  return price * (1 - discountPercent / 100);
}
```

### Comentários inline (quando necessário)

```typescript
// Snapshot price at order creation time to preserve historical data
const unitPrice = product.price;

// Validate stock availability before creating order
await this.stockService.validateAvailability(items);
```

---

## Tratamento de Erros

### Custom Errors

```typescript
// libs/domain/src/errors/product-not-found.error.ts
export class ProductNotFoundException extends Error {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`);
    this.name = 'ProductNotFoundException';
  }
}

// Uso
if (!product) {
  throw new ProductNotFoundException(productId);
}
```

---

## Validação de Dados

### Zod Schemas

```typescript
// apps/api/src/schemas/product.schema.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  categoryId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

---

## 🧪 Testes

> 📖 **Documentação completa de testes:** [docs/testing.md](testing.md)

### Nomenclatura de Arquivos de Teste

| Tipo de Teste | Convenção | Exemplo |
|---------------|-----------|---------|
| **Unitário** | `*.spec.ts` | `product.service.spec.ts` |
| **Integração** | `*.spec.ts` | `product.controller.spec.ts` |
| **E2E** | `*.e2e-spec.ts` | `products.e2e-spec.ts` |

### Estrutura de describe/it

```typescript
describe('NomeDaClasse', () => {
  describe('nomeDoMetodo', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    });
  });
});
```

**Exemplos de nomes descritivos:**

```typescript
// ✅ Bom - Descreve claramente o comportamento esperado
it('should calculate total amount correctly with multiple items', () => { ... });
it('should throw ProductNotFoundException when product does not exist', () => { ... });
it('should return empty array when no products match the filter', () => { ... });

// ❌ Ruim - Vago ou não descritivo
it('should work', () => { ... });
it('test calculate', () => { ... });
it('returns products', () => { ... });
```

### Padrão AAA (Arrange-Act-Assert)

Todos os testes devem seguir o padrão **AAA**:

```typescript
describe('OrderCalculationService', () => {
  describe('calculateTotal', () => {
    it('should calculate total amount correctly with multiple items', () => {
      // Arrange - Preparar dados e dependências
      const items = [
        { productId: '1', quantity: 2, unitPrice: 10, subtotal: 20 },
        { productId: '2', quantity: 1, unitPrice: 15, subtotal: 15 },
      ];
      const service = new OrderCalculationService();
      
      // Act - Executar a ação a ser testada
      const total = service.calculateTotal(items);
      
      // Assert - Verificar o resultado esperado
      expect(total).toBe(35);
    });
  });
});
```

### Estrutura de Testes Completa

```typescript
describe('CreateOrderUseCase', () => {
  // Variáveis compartilhadas
  let useCase: CreateOrderUseCase;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;

  // Setup antes de cada teste
  beforeEach(() => {
    mockProductRepository = {
      findByIds: jest.fn(),
    } as any;

    mockOrderRepository = {
      create: jest.fn(),
    } as any;

    useCase = new CreateOrderUseCase(
      mockProductRepository,
      mockOrderRepository
    );
  });

  // Limpar mocks após cada teste
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create order successfully with valid items', async () => {
      // Arrange
      const input = {
        items: [{ productId: 'prod-1', quantity: 2 }],
      };
      
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', price: 10 },
      ];

      mockProductRepository.findByIds.mockResolvedValue(mockProducts);
      mockOrderRepository.create.mockResolvedValue({ id: 'order-1' });

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('order-1');
      expect(mockProductRepository.findByIds).toHaveBeenCalledWith(['prod-1']);
      expect(mockOrderRepository.create).toHaveBeenCalled();
    });

    it('should throw error when product is not found', async () => {
      // Arrange
      const input = {
        items: [{ productId: 'invalid-id', quantity: 1 }],
      };
      
      mockProductRepository.findByIds.mockResolvedValue([]);

      // Act & Assert
      await expect(useCase.execute(input))
        .rejects
        .toThrow(ProductNotFoundException);
    });
  });
});
```

### Boas Práticas

#### ✅ Do's (Faça)

- Use nomes descritivos para describe e it
- Siga o padrão AAA (Arrange-Act-Assert)
- Teste apenas um conceito por teste
- Use mocks para dependências externas
- Limpe mocks após cada teste (`afterEach`)
- Teste casos de sucesso E casos de erro
- Use `beforeEach` para setup comum

#### ❌ Don'ts (Não Faça)

- Não teste detalhes de implementação
- Não crie testes dependentes entre si
- Não use dados hardcoded sem contexto
- Não faça testes muito longos (>50 linhas)
- Não ignore testes falhando (`.skip()`)
- Não teste bibliotecas externas
- Não compartilhe estado entre testes

### Exemplos de Assertions Comuns

```typescript
// Igualdade
expect(result).toBe(10);
expect(result).toEqual({ id: '1', name: 'Product' });

// Verdade/Falsidade
expect(isActive).toBeTruthy();
expect(isDeleted).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Números
expect(price).toBeGreaterThan(0);
expect(quantity).toBeGreaterThanOrEqual(1);
expect(discount).toBeLessThan(100);

// Strings
expect(name).toContain('Product');
expect(email).toMatch(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);

// Arrays
expect(products).toHaveLength(3);
expect(ids).toContain('prod-1');
expect(items).toEqual(expect.arrayContaining([
  expect.objectContaining({ id: '1' }),
]));

// Objetos
expect(product).toHaveProperty('name');
expect(order).toMatchObject({
  status: 'PENDING',
  totalAmount: 100,
});

// Exceções
expect(() => service.method()).toThrow(CustomError);
expect(() => service.method()).toThrow('Error message');

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow(Error);

// Funções mock
expect(mockFunction).toHaveBeenCalled();
expect(mockFunction).toHaveBeenCalledTimes(1);
expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2');
```

---

## Git Branch Naming

```bash
# Features
feat/add-order-status-endpoint
feat/product-image-upload

# Fixes
fix/stock-negative-validation
fix/order-total-calculation

# Refactoring
refactor/extract-price-service
refactor/simplify-repository-queries

# Documentation
docs/update-api-endpoints
docs/add-architecture-diagram

# Chores
chore/update-dependencies
chore/configure-ci
```

---

[⬆ Voltar para README](../README.md)
