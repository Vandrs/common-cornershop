import { DataSource, Repository } from 'typeorm';

import { Product } from '@domain/entities/product.entity';
import { Category } from '@domain/entities/category.entity';

/**
 * Seed data definition for products.
 * `categoryName` is resolved to a real `categoryId` at runtime via the
 * category map returned by {@link seedCategories}.
 */
interface ProductSeedData {
  name: string;
  description: string;
  price: number;
  categoryName: string;
}

const PRODUCT_SEEDS: ProductSeedData[] = [
  // Bebidas
  {
    name: 'Coca-Cola 2L',
    description: 'Refrigerante sabor cola, garrafa 2 litros',
    price: 8.5,
    categoryName: 'Bebidas',
  },
  {
    name: 'Guaraná Antarctica 2L',
    description: 'Refrigerante sabor guaraná, garrafa 2 litros',
    price: 7.5,
    categoryName: 'Bebidas',
  },
  {
    name: 'Água Mineral Crystal 500ml',
    description: 'Água mineral sem gás, garrafa 500ml',
    price: 2.5,
    categoryName: 'Bebidas',
  },
  // Snacks
  {
    name: 'Doritos Nacho 96g',
    description: 'Salgadinho de milho sabor nacho, pacote 96g',
    price: 5.99,
    categoryName: 'Snacks',
  },
  {
    name: 'Ruffles Original 96g',
    description: 'Salgadinho de batata ondulado, pacote 96g',
    price: 5.49,
    categoryName: 'Snacks',
  },
  // Laticínios
  {
    name: 'Leite Integral Itambé 1L',
    description: 'Leite integral UHT, caixa 1 litro',
    price: 4.99,
    categoryName: 'Laticínios',
  },
  {
    name: 'Queijo Muçarela Presidente 200g',
    description: 'Queijo muçarela fatiado, pacote 200g',
    price: 12.9,
    categoryName: 'Laticínios',
  },
  // Higiene
  {
    name: 'Sabonete Dove Original 90g',
    description: 'Sabonete em barra hidratante, 90g',
    price: 3.5,
    categoryName: 'Higiene',
  },
  {
    name: 'Shampoo Head & Shoulders 200ml',
    description: 'Shampoo anticaspa, frasco 200ml',
    price: 14.9,
    categoryName: 'Higiene',
  },
  // Mercearia
  {
    name: 'Arroz Tio João 5kg',
    description: 'Arroz branco tipo 1, pacote 5kg',
    price: 22.9,
    categoryName: 'Mercearia',
  },
  {
    name: 'Feijão Carioca Camil 1kg',
    description: 'Feijão carioca tipo 1, pacote 1kg',
    price: 8.9,
    categoryName: 'Mercearia',
  },
  {
    name: 'Macarrão Renata Espaguete 500g',
    description: 'Macarrão espaguete grano duro, pacote 500g',
    price: 4.29,
    categoryName: 'Mercearia',
  },
];

/**
 * Seeds the products table with initial data.
 *
 * Idempotent: skips insertion if a product with the same name already exists.
 * Requires a pre-built category map from {@link seedCategories} to resolve
 * category IDs without additional DB queries.
 *
 * @param dataSource   - The initialized TypeORM DataSource.
 * @param categoryMap  - Map of category name → persisted Category entity.
 * @returns A map of product name to persisted Product entity,
 *          useful for downstream stock seeding.
 */
export async function seedProducts(
  dataSource: DataSource,
  categoryMap: Map<string, Category>,
): Promise<Map<string, Product>> {
  const repository: Repository<Product> = dataSource.getRepository(Product);
  const productMap = new Map<string, Product>();

  for (const data of PRODUCT_SEEDS) {
    const existing = await repository.findOne({ where: { name: data.name } });

    if (existing) {
      console.log(`[ProductSeed] Already exists: "${data.name}" — skipping.`);
      productMap.set(data.name, existing);
      continue;
    }

    const category = categoryMap.get(data.categoryName);

    if (!category) {
      console.warn(
        `[ProductSeed] Category "${data.categoryName}" not found for product "${data.name}" — skipping.`,
      );
      continue;
    }

    const product = repository.create({
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: category.id,
      isActive: true,
    });

    const saved = await repository.save(product);
    productMap.set(saved.name, saved);
    console.log(`[ProductSeed] Inserted: "${saved.name}" (id: ${saved.id})`);
  }

  return productMap;
}
