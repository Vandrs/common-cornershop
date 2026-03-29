import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Product } from './product.entity';

/**
 * Domain entity representing the stock (inventory) for a single product.
 *
 * Each product has exactly one associated stock record. The `minimumQuantity`
 * field can be used to trigger low-stock alerts.
 */
@Entity('stocks')
export class Stock extends BaseEntity {
  /**
   * Foreign key referencing the product whose stock this record tracks.
   */
  @Column({ type: 'uuid', unique: true, name: 'product_id' })
  productId!: string;

  /**
   * Current number of units in stock.
   * Defaults to `0` on creation.
   */
  @Column({ type: 'int', default: 0, name: 'quantity' })
  quantity!: number;

  /**
   * Threshold below which the stock is considered low.
   * Defaults to `0` on creation.
   */
  @Column({ type: 'int', default: 0, name: 'minimum_quantity' })
  minimumQuantity!: number;

  /**
   * Timestamp of the last stock quantity update.
   */
  @Column({ type: 'timestamp', name: 'last_updated_at' })
  lastUpdatedAt!: Date;

  /**
   * The product associated with this stock record.
   */
  @OneToOne(() => Product, (product) => product.stock)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
