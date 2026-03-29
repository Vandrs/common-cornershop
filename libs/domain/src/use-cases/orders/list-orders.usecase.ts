import { injectable, inject } from 'tsyringe';

import { PaginatedResult } from '@shared/types/pagination.types';

import { Order } from '../../entities/order.entity';
import { IOrderRepository, OrderListParams } from '../../repositories/order.repository';

/**
 * Use case for listing orders with optional filters and pagination.
 *
 * Thin delegation layer that maps the incoming parameters directly to the
 * repository, keeping the controller free from infrastructure concerns.
 */
@injectable()
export class ListOrdersUseCase {
  constructor(
    @inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  /**
   * Executes the list-orders operation.
   *
   * @param params - Pagination and filter parameters for the query.
   * @returns A {@link PaginatedResult} containing matching {@link Order} entities.
   */
  async execute(params: OrderListParams): Promise<PaginatedResult<Order>> {
    return this.orderRepository.list(params);
  }
}
