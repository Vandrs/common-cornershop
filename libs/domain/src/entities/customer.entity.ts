import { Entity, Column, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Order } from './order.entity';

/**
 * Domain entity representing a customer who places orders.
 */
@Entity('customers')
export class Customer extends BaseEntity {
  /**
   * Full name of the customer.
   */
  @Column({ type: 'varchar', length: 100, name: 'name' })
  name!: string;

  /**
   * Unique email address of the customer.
   */
  @Column({ type: 'varchar', length: 255, name: 'email' })
  email!: string;

  /**
   * Unique phone number of the customer.
   */
  @Column({ type: 'varchar', length: 20, name: 'phone' })
  phone!: string;

  /**
   * Orders placed by this customer.
   */
  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];
}
