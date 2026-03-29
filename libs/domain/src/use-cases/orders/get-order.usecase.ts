import { injectable, inject } from 'tsyringe';

import { Order } from '../../entities/order.entity';
import { OrderService } from '../../services/order.service';

/**
 * Use case for retrieving a single order by its identifier.
 *
 * Delegates existence validation to {@link OrderService}, ensuring a consistent
 * domain error is thrown when the order is not found.
 */
@injectable()
export class GetOrderUseCase {
  constructor(
    @inject('OrderService')
    private readonly orderService: OrderService,
  ) {}

  /**
   * Executes the get-order operation.
   *
   * @param id - UUID of the order to retrieve.
   * @returns The resolved {@link Order} entity.
   * @throws {OrderNotFoundException} When no order with that id exists.
   */
  async execute(id: string): Promise<Order> {
    return this.orderService.findOrFail(id);
  }
}
