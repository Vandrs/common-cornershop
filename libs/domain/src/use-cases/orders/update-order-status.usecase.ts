import { injectable, inject } from 'tsyringe';

import { Order } from '../../entities/order.entity';
import { OrderStatus } from '../../enums/order-status.enum';
import { IOrderRepository } from '../../repositories/order.repository';
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

    return this.orderRepository.updateStatus(dto.id, dto.status);
  }
}
