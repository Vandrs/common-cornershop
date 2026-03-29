import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Order } from './order.entity';
import { Product } from './product.entity';

/**
 * Domain entity representing a single line item within an order.
 *
 * Captures the snapshot of the product price at order creation time
 * (`unitPrice`) so that historical pricing is preserved even if the
 * product price changes later.
 */
@Entity('order_items')
export class OrderItem extends BaseEntity {
  /**
   * Foreign key referencing the parent order.
   */
  @Column({ type: 'uuid', name: 'order_id' })
  orderId!: string;

  /**
   * Foreign key referencing the product purchased.
   */
  @Column({ type: 'uuid', name: 'product_id' })
  productId!: string;

  /**
   * Number of units of the product in this line item.
   */
  @Column({ type: 'int', name: 'quantity' })
  quantity!: number;

  /**
   * Price per unit of the product at the time the order was created.
   * Stored with two decimal places.
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'unit_price' })
  unitPrice!: number;

  /**
   * Total cost for this line item: `quantity × unitPrice`.
   * Stored with two decimal places.
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'subtotal' })
  subtotal!: number;

  /**
   * The order this item belongs to.
   */
  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  /**
   * The product referenced by this line item.
   */
  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'product_id' })
  product!: Product;
}
