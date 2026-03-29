import { injectable, inject } from 'tsyringe';

import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { OrderStatus } from '../../enums/order-status.enum';
import { ProductNotFoundException } from '../../errors/product-not-found.error';
import { IOrderRepository } from '../../repositories/order.repository';
import { IProductRepository } from '../../repositories/product.repository';
import { OrderService, CreateOrderItemDTO } from '../../services/order.service';
import { StockService } from '../../services/stock.service';

/**
 * Input data required to create a new order.
 */
export interface CreateOrderDTO {
  /** List of items to include in the order. Must contain at least one item. */
  items: CreateOrderItemDTO[];
}

/**
 * Use case for creating a new customer order.
 *
 * Validates product availability and active status, checks stock sufficiency,
 * takes a price snapshot for each item, and atomically persists the order
 * together with its line items.
 */
@injectable()
export class CreateOrderUseCase {
  constructor(
    @inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @inject('StockService')
    private readonly stockService: StockService,
    @inject('OrderService')
    private readonly orderService: OrderService,
  ) {}

  /**
   * Executes the create-order operation.
   *
   * @param dto - Data required to create the order, including at least one item.
   * @returns The newly created and persisted {@link Order} entity.
   * @throws {ProductNotFoundException} When any referenced product does not exist or is inactive.
   * @throws {InsufficientStockError} When available stock is below the requested quantity for any item.
   */
  async execute(dto: CreateOrderDTO): Promise<Order> {
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.productRepository.findByIds(productIds);

    // Validate all products exist
    const productMap = new Map(products.map((p) => [p.id, p]));
    for (const item of dto.items) {
      const product = productMap.get(item.productId);
      if (!product) {
        throw new ProductNotFoundException();
      }
      // Validate product is active
      if (!product.isActive) {
        throw new ProductNotFoundException();
      }
    }

    // Validate stock for each item
    for (const item of dto.items) {
      await this.stockService.validateSufficientStock(item.productId, item.quantity);
    }

    // Calculate price snapshots and subtotals
    const orderItemsData = this.orderService.calculateOrderItems(dto.items, products);
    const totalAmount = this.orderService.calculateTotal(orderItemsData);
    const orderNumber = this.orderService.generateOrderNumber();

    // Build Order entity
    const order = new Order();
    order.orderNumber = orderNumber;
    order.status = OrderStatus.PENDING;
    order.totalAmount = totalAmount;

    // Build OrderItem entities
    const orderItems = orderItemsData.map((data) => {
      const item = new OrderItem();
      item.productId = data.productId;
      item.quantity = data.quantity;
      item.unitPrice = data.unitPrice;
      item.subtotal = data.subtotal;
      return item;
    });

    return this.orderRepository.createWithItems(order, orderItems);
  }
}
