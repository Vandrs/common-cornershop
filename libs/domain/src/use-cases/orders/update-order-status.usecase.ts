import { injectable, inject } from 'tsyringe';

import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';
import { IOrderItemRepository } from '../../repositories/order-item.repository';
import { IOrderRepository } from '../../repositories/order.repository';
import { IStockRepository } from '../../repositories/stock.repository';
import { OrderService } from '../../services/order.service';

/**
 * DTO carrying the fields required to update an order's status.
 */
export interface UpdateOrderStatusDTO {
  /** UUID of the order to update. */
  id: string;
  /** The target lifecycle status. Must be a valid transition from the current status. */
  status: OrderStatus;
}

/**
 * Use case for updating the status of an existing order.
 *
 * Validates that the order exists and that the requested status transition
 * is permitted by the domain lifecycle rules before persisting the change.
 */
@injectable()
export class UpdateOrderStatusUseCase {
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
   * Executes the update-order-status operation.
   *
   * @param dto - Data containing the order id and desired target status.
   * @returns The updated {@link Order} entity with the new status.
   * @throws {OrderNotFoundException} When no order with that id exists.
   * @throws {InvalidOrderStatusTransitionError} When the transition is not allowed.
   */
  async execute(dto: UpdateOrderStatusDTO): Promise<Order> {
    const order = await this.orderService.findOrFail(dto.id);

    this.orderService.validateStatusTransition(order.status, dto.status);

    if (order.status === OrderStatus.PENDING && dto.status === OrderStatus.PROCESSING) {
      const orderItems = await this.orderItemRepository.findByOrderId(order.id);
      const debitedItems: Array<{ productId: string; quantity: number }> = [];

      try {
        for (const item of orderItems) {
          await this.stockRepository.adjustQuantity(item.productId, -item.quantity);
          debitedItems.push({ productId: item.productId, quantity: item.quantity });
        }

        const updatedOrder = await this.orderRepository.updateStatus(dto.id, dto.status);

        return updatedOrder;
      } catch (error) {
        await this.rollbackDebits(debitedItems);
        throw error;
      }
    }

    return this.orderRepository.updateStatus(dto.id, dto.status);
  }

  /**
   * Best-effort compensation to revert previously debited stock.
   */
  private async rollbackDebits(
    debitedItems: Array<{ productId: string; quantity: number }>,
  ): Promise<void> {
    for (let index = debitedItems.length - 1; index >= 0; index -= 1) {
      const item = debitedItems[index];

      try {
        await this.stockRepository.adjustQuantity(item.productId, item.quantity);
      } catch {
        // Intentionally ignored to preserve the original failure.
      }
    }
  }
}
