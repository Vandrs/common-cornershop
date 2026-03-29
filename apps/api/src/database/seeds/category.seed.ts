import { DataSource, Repository } from 'typeorm';

import { Category } from '@domain/entities/category.entity';

/**
 * Seed data definition for categories.
 */
interface CategorySeedData {
  name: string;
  description: string;
}

const CATEGORY_SEEDS: CategorySeedData[] = [
  {
    name: 'Bebidas',
    description: 'Refrigerantes, sucos e águas',
  },
  {
    name: 'Snacks',
    description: 'Salgadinhos e petiscos',
  },
  {
    name: 'Laticínios',
    description: 'Leite, queijos e derivados',
  },
  {
    name: 'Higiene',
    description: 'Produtos de limpeza e higiene pessoal',
  },
  {
    name: 'Mercearia',
    description: 'Arroz, feijão, massas e enlatados',
  },
];

/**
 * Seeds the categories table with initial data.
 *
 * Idempotent: skips insertion if a category with the same name already exists.
 *
 * @param dataSource - The initialized TypeORM DataSource.
 * @returns A map of category name to persisted Category entity,
 *          useful for downstream seeds that require category IDs.
 */
export async function seedCategories(dataSource: DataSource): Promise<Map<string, Category>> {
  const repository: Repository<Category> = dataSource.getRepository(Category);
  const categoryMap = new Map<string, Category>();

  for (const data of CATEGORY_SEEDS) {
    const existing = await repository.findOne({ where: { name: data.name } });

    if (existing) {
      console.log(`[CategorySeed] Already exists: "${data.name}" — skipping.`);
      categoryMap.set(data.name, existing);
      continue;
    }

    const category = repository.create({
      name: data.name,
      description: data.description,
      isActive: true,
    });

    const saved = await repository.save(category);
    categoryMap.set(saved.name, saved);
    console.log(`[CategorySeed] Inserted: "${saved.name}" (id: ${saved.id})`);
  }

  return categoryMap;
}
