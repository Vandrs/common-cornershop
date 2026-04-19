import { injectable, inject } from 'tsyringe';

import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';
import { IOrderItemRepository } from '../../repositories/order-item.repository';
import { IOrderRepository } from '../../repositories/order.repository';
import { IStockRepository } from '../../repositories/stock.repository';
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
    @inject('IOrderItemRepository')
    private readonly orderItemRepository: IOrderItemRepository,
    @inject('IStockRepository')
    private readonly stockRepository: IStockRepository,
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

    if (order.status === OrderStatus.PROCESSING) {
      const orderItems = await this.orderItemRepository.findByOrderId(order.id);

      for (const item of orderItems) {
        await this.stockRepository.adjustQuantity(item.productId, item.quantity);
      }
    }

    return this.orderRepository.updateStatus(id, OrderStatus.CANCELLED);
  }
}
