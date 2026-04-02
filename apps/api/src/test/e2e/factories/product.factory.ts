interface ProductFactoryInput {
  name?: string;
  description?: string | null;
  price?: number;
  isActive?: boolean;
}

export interface ProductSeedData {
  name: string;
  description: string | null;
  price: number;
  isActive: boolean;
}

/**
 * Deterministic builder for product seed data used in E2E tests.
 */
export class ProductFactory {
  private static sequence = 1;

  static reset(): void {
    this.sequence = 1;
  }

  static build(input: ProductFactoryInput = {}): ProductSeedData {
    const seed = this.sequence++;

    return {
      name: input.name ?? `Produto E2E ${seed}`,
      description: input.description ?? `Descrição produto E2E ${seed}`,
      price: input.price ?? seed * 10,
      isActive: input.isActive ?? true,
    };
  }
}
