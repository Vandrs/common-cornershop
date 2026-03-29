import { injectable, inject } from 'tsyringe';

import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';
import { IOrderRepository } from '../../repositories/order.repository';
import { OrderService } from '../../services/order.service';

/**
 * Use case for cancelling an existing order.
 *
 * Validates that the order exists and that it can be transitioned to the
 * CANCELLED state before persisting the change. This is a specialised
 * shortcut over {@link UpdateOrderStatusUseCase} for the cancellation flow.
 */
@injectable()
export class CancelOrderUseCase {
  constructor(
    @inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @inject('OrderService')
    private readonly orderService: OrderService,
  ) {}

  /**
   * Executes the cancel-order operation.
   *
   * @param id - UUID of the order to cancel.
   * @returns The updated {@link Order} entity with status set to CANCELLED.
   * @throws {OrderNotFoundException} When no order with that id exists.
   * @throws {InvalidOrderStatusTransitionError} When the order is already in a terminal state (COMPLETED or CANCELLED).
   */
  async execute(id: string): Promise<Order> {
    const order = await this.orderService.findOrFail(id);

    this.orderService.validateStatusTransition(order.status, OrderStatus.CANCELLED);

    return this.orderRepository.updateStatus(id, OrderStatus.CANCELLED);
  }
}
