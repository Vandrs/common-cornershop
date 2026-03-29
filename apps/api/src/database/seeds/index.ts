import { DataSource } from 'typeorm';

import { seedCategories } from './category.seed';
import { seedProducts } from './product.seed';
import { seedStocks } from './stock.seed';

/**
 * Orchestrates all seed scripts in the correct dependency order:
 *   1. Categories  (no dependencies)
 *   2. Products    (depends on category IDs)
 *   3. Stocks      (depends on product IDs)
 *
 * Each individual seed is idempotent — safe to run multiple times.
 *
 * @param dataSource - An already-initialized TypeORM DataSource.
 */
export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('[Seeds] Starting seed execution...');

  const categoryMap = await seedCategories(dataSource);
  console.log(`[Seeds] Categories done (${categoryMap.size} entries in map).`);

  const productMap = await seedProducts(dataSource, categoryMap);
  console.log(`[Seeds] Products done (${productMap.size} entries in map).`);

  await seedStocks(dataSource, productMap);
  console.log('[Seeds] Stocks done.');

  console.log('[Seeds] All seeds completed successfully.');
}
