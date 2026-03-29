import { Entity, Column, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Product } from './product.entity';

/**
 * Domain entity representing a product category.
 *
 * Categories group related products and can be activated or deactivated.
 * A single category can contain many products.
 */
@Entity('categories')
export class Category extends BaseEntity {
  /**
   * Human-readable name of the category.
   */
  @Column({ type: 'varchar', length: 100, name: 'name' })
  name!: string;

  /**
   * Optional detailed description of the category.
   */
  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string;

  /**
   * Whether the category is currently active and visible.
   * Defaults to `true` on creation.
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  /**
   * Collection of products belonging to this category.
   */
  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
