import { Entity, Column, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderItem } from './order-item.entity';

/**
 * Domain entity representing a customer order.
 *
 * An order aggregates one or more order items and tracks the overall status
 * and total monetary amount. The `orderNumber` is a business-readable unique
 * identifier distinct from the internal UUID.
 */
@Entity('orders')
export class Order extends BaseEntity {
  /**
   * Business-readable unique order identifier (e.g. "ORD-2024-00001").
   */
  @Column({ type: 'varchar', unique: true, name: 'order_number' })
  orderNumber!: string;

  /**
   * Current lifecycle status of the order.
   * Defaults to `OrderStatus.PENDING` on creation.
   */
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING, name: 'status' })
  status!: OrderStatus;

  /**
   * Total monetary value of the order, computed from its line items.
   * Stored with two decimal places. Defaults to `0`.
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'total_amount' })
  totalAmount!: number;

  /**
   * Line items that compose this order.
   */
  @OneToMany(() => OrderItem, (item) => item.order)
  items!: OrderItem[];
}
