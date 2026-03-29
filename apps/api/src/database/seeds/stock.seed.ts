import { DataSource, Repository } from 'typeorm';

import { Stock } from '@domain/entities/stock.entity';
import { Product } from '@domain/entities/product.entity';

/**
 * Seed data definition for stock entries.
 * `productName` is resolved to a real `productId` at runtime via the
 * product map returned by {@link seedProducts}.
 */
interface StockSeedData {
  productName: string;
  quantity: number;
  minimumQuantity: number;
}

const STOCK_SEEDS: StockSeedData[] = [
  // Bebidas
  { productName: 'Coca-Cola 2L', quantity: 80, minimumQuantity: 15 },
  { productName: 'Guaraná Antarctica 2L', quantity: 60, minimumQuantity: 10 },
  { productName: 'Água Mineral Crystal 500ml', quantity: 100, minimumQuantity: 20 },
  // Snacks
  { productName: 'Doritos Nacho 96g', quantity: 75, minimumQuantity: 15 },
  { productName: 'Ruffles Original 96g', quantity: 70, minimumQuantity: 10 },
  // Laticínios
  { productName: 'Leite Integral Itambé 1L', quantity: 50, minimumQuantity: 10 },
  { productName: 'Queijo Muçarela Presidente 200g', quantity: 30, minimumQuantity: 5 },
  // Higiene
  { productName: 'Sabonete Dove Original 90g', quantity: 90, minimumQuantity: 20 },
  { productName: 'Shampoo Head & Shoulders 200ml', quantity: 45, minimumQuantity: 8 },
  // Mercearia
  { productName: 'Arroz Tio João 5kg', quantity: 40, minimumQuantity: 10 },
  { productName: 'Feijão Carioca Camil 1kg', quantity: 55, minimumQuantity: 10 },
  { productName: 'Macarrão Renata Espaguete 500g', quantity: 65, minimumQuantity: 12 },
];

/**
 * Seeds the stocks table with one stock record per product.
 *
 * Idempotent: skips insertion if a stock record for the same product already
 * exists (matched by `productId` unique constraint).
 * Requires a pre-built product map from {@link seedProducts} to resolve
 * product IDs without additional DB queries.
 *
 * @param dataSource  - The initialized TypeORM DataSource.
 * @param productMap  - Map of product name → persisted Product entity.
 */
export async function seedStocks(
  dataSource: DataSource,
  productMap: Map<string, Product>,
): Promise<void> {
  const repository: Repository<Stock> = dataSource.getRepository(Stock);

  for (const data of STOCK_SEEDS) {
    const product = productMap.get(data.productName);

    if (!product) {
      console.warn(
        `[StockSeed] Product "${data.productName}" not found in product map — skipping.`,
      );
      continue;
    }

    const existing = await repository.findOne({ where: { productId: product.id } });

    if (existing) {
      console.log(`[StockSeed] Already exists for product "${data.productName}" — skipping.`);
      continue;
    }

    const stock = repository.create({
      productId: product.id,
      quantity: data.quantity,
      minimumQuantity: data.minimumQuantity,
      lastUpdatedAt: new Date(),
    });

    await repository.save(stock);
    console.log(
      `[StockSeed] Inserted stock for "${data.productName}" (qty: ${data.quantity}, min: ${data.minimumQuantity})`,
    );
  }
}
