import { Entity, Column, ManyToOne, OneToOne, OneToMany, JoinColumn } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Category } from './category.entity';
import { Stock } from './stock.entity';
import { OrderItem } from './order-item.entity';

/**
 * Domain entity representing a product available for purchase.
 *
 * A product belongs to a single category, has a corresponding stock record,
 * and can appear as a line item across multiple orders.
 */
@Entity('products')
export class Product extends BaseEntity {
  /**
   * Human-readable name of the product.
   */
  @Column({ type: 'varchar', length: 200, name: 'name' })
  name!: string;

  /**
   * Optional detailed description of the product.
   */
  @Column({ type: 'text', name: 'description', nullable: true })
  description?: string;

  /**
   * Selling price of the product, stored with two decimal places.
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'price' })
  price!: number;

  /**
   * Foreign key referencing the category this product belongs to.
   */
  @Column({ type: 'uuid', name: 'category_id' })
  categoryId!: string;

  /**
   * Whether the product is currently active and available for purchase.
   * Defaults to `true` on creation.
   */
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  /**
   * The category this product belongs to.
   */
  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  /**
   * One-to-one stock record tracking the available inventory for this product.
   */
  @OneToOne(() => Stock, (stock) => stock.product)
  stock!: Stock;

  /**
   * Order line items that reference this product.
   */
  @OneToMany(() => OrderItem, (orderItem) => orderItem.product)
  orderItems!: OrderItem[];
}
