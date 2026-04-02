interface CategoryFactoryInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface CategorySeedData {
  name: string;
  description: string | null;
  isActive: boolean;
}

/**
 * Deterministic builder for category seed data used in E2E tests.
 */
export class CategoryFactory {
  private static sequence = 1;

  static reset(): void {
    this.sequence = 1;
  }

  static build(input: CategoryFactoryInput = {}): CategorySeedData {
    const seed = this.sequence++;

    return {
      name: input.name ?? `Categoria E2E ${seed}`,
      description: input.description ?? `Descrição E2E ${seed}`,
      isActive: input.isActive ?? true,
    };
  }
}
