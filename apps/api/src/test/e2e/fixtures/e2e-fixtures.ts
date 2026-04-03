import { DataSource, Repository } from 'typeorm';

import { Category } from '@domain/entities/category.entity';
import { Product } from '@domain/entities/product.entity';
import { Stock } from '@domain/entities/stock.entity';

import { CategoryFactory } from '../factories/category.factory';
import { ProductFactory } from '../factories/product.factory';

interface ProductFixtureInput {
  categoryId: string;
  name?: string;
  description?: string | null;
  price?: number;
  isActive?: boolean;
  stockQuantity?: number;
  minimumQuantity?: number;
}

export interface ProductWithStockFixture {
  product: Product;
  stock: Stock;
}

/**
 * Reusable fixture helpers for E2E tests.
 */
export class E2EFixtures {
  private readonly categoryRepository: Repository<Category>;
  private readonly productRepository: Repository<Product>;
  private readonly stockRepository: Repository<Stock>;

  constructor(private readonly dataSource: DataSource) {
    this.categoryRepository = dataSource.getRepository(Category);
    this.productRepository = dataSource.getRepository(Product);
    this.stockRepository = dataSource.getRepository(Stock);
  }

  async clearDatabase(): Promise<void> {
    await this.dataSource.query(
      'TRUNCATE TABLE "order_items", "orders", "stocks", "products", "categories" RESTART IDENTITY CASCADE',
    );
  }

  resetFactories(): void {
    CategoryFactory.reset();
    ProductFactory.reset();
  }

  async createCategory(overrides: Partial<Category> = {}): Promise<Category> {
    const base = CategoryFactory.build({
      name: overrides.name,
      description: overrides.description,
      isActive: overrides.isActive,
    });

    const categoryToCreate = this.categoryRepository.create({
      name: base.name,
      description: base.description ?? undefined,
      isActive: base.isActive,
    });

    return this.categoryRepository.save(categoryToCreate);
  }

  async createProductWithStock(input: ProductFixtureInput): Promise<ProductWithStockFixture> {
    const productBase = ProductFactory.build({
      name: input.name,
      description: input.description,
      price: input.price,
      isActive: input.isActive,
    });

    const productToCreate = this.productRepository.create({
      name: productBase.name,
      description: productBase.description ?? undefined,
      price: productBase.price,
      isActive: productBase.isActive,
      categoryId: input.categoryId,
    });

    const product = await this.productRepository.save(productToCreate);

    const stock = await this.stockRepository.save(
      this.stockRepository.create({
        productId: product.id,
        quantity: input.stockQuantity ?? 10,
        minimumQuantity: input.minimumQuantity ?? 1,
        lastUpdatedAt: new Date('2026-01-01T00:00:00.000Z'),
      }),
    );

    return { product, stock };
  }
}
