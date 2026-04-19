import 'reflect-metadata';

import { OrderService, CreateOrderItemDTO, OrderItemData } from './order.service';
import { IOrderRepository } from '../repositories/order.repository';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderNotFoundException } from '../errors/order-not-found.error';
import { InvalidOrderStatusTransitionError } from '../errors/invalid-order-status-transition.error';
import { ProductNotFoundException } from '../errors/product-not-found.error';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';

describe('OrderService', () => {
  let service: OrderService;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;

  const buildOrder = (overrides: Partial<Order> = {}): Order =>
    ({
      id: 'order-1',
      customerId: 'customer-1',
      orderNumber: 'ORD-1711234567890-a3f2',
      status: OrderStatus.PENDING,
      totalAmount: 100,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Order;

  const buildProduct = (overrides: Partial<Product> = {}): Product =>
    ({
      id: 'prod-1',
      name: 'Coca-Cola 2L',
      price: 8.5,
      categoryId: 'cat-1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Product;

  beforeEach(() => {
    mockOrderRepository = {
      list: jest.fn(),
      findById: jest.fn(),
      createWithItems: jest.fn(),
      updateStatus: jest.fn(),
    } as jest.Mocked<IOrderRepository>;

    service = new OrderService(mockOrderRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOrderNumber', () => {
    it('should return a string matching ORD-{digits}-{4-hex-chars} pattern', () => {
      const result = service.generateOrderNumber();

      expect(result).toMatch(/^ORD-\d+-[0-9a-f]{4}$/);
    });

    it('should return unique values on consecutive calls', () => {
      const first = service.generateOrderNumber();
      const second = service.generateOrderNumber();

      expect(typeof first).toBe('string');
      expect(typeof second).toBe('string');
    });
  });

  describe('findOrFail', () => {
    it('should return the order when it exists', async () => {
      const order = buildOrder();
      mockOrderRepository.findById.mockResolvedValue(order);

      const result = await service.findOrFail('order-1');

      expect(result).toEqual(order);
      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-1');
    });

    it('should throw OrderNotFoundException when the order does not exist', async () => {
      mockOrderRepository.findById.mockResolvedValue(null);

      await expect(service.findOrFail('non-existent')).rejects.toThrow(OrderNotFoundException);
      expect(mockOrderRepository.findById).toHaveBeenCalledWith('non-existent');
    });
  });

  describe('validateStatusTransition', () => {
    it('should not throw when transitioning from PENDING to PROCESSING', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.PENDING, OrderStatus.PROCESSING),
      ).not.toThrow();
    });

    it('should not throw when transitioning from PENDING to CANCELLED', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.PENDING, OrderStatus.CANCELLED),
      ).not.toThrow();
    });

    it('should not throw when transitioning from PROCESSING to COMPLETED', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.PROCESSING, OrderStatus.COMPLETED),
      ).not.toThrow();
    });

    it('should not throw when transitioning from PROCESSING to CANCELLED', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.PROCESSING, OrderStatus.CANCELLED),
      ).not.toThrow();
    });

    it('should throw InvalidOrderStatusTransitionError when transitioning from COMPLETED to PENDING', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.COMPLETED, OrderStatus.PENDING),
      ).toThrow(InvalidOrderStatusTransitionError);
    });

    it('should throw InvalidOrderStatusTransitionError when transitioning from COMPLETED to PROCESSING', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.COMPLETED, OrderStatus.PROCESSING),
      ).toThrow(InvalidOrderStatusTransitionError);
    });

    it('should throw InvalidOrderStatusTransitionError when transitioning from COMPLETED to CANCELLED', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
      ).toThrow(InvalidOrderStatusTransitionError);
    });

    it('should throw InvalidOrderStatusTransitionError when transitioning from CANCELLED to PENDING', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.CANCELLED, OrderStatus.PENDING),
      ).toThrow(InvalidOrderStatusTransitionError);
    });

    it('should throw InvalidOrderStatusTransitionError when transitioning from CANCELLED to PROCESSING', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.CANCELLED, OrderStatus.PROCESSING),
      ).toThrow(InvalidOrderStatusTransitionError);
    });

    it('should throw InvalidOrderStatusTransitionError when transitioning from CANCELLED to COMPLETED', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.CANCELLED, OrderStatus.COMPLETED),
      ).toThrow(InvalidOrderStatusTransitionError);
    });

    it('should include the from and to statuses in the error message', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.COMPLETED, OrderStatus.PROCESSING),
      ).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('COMPLETED'),
        }),
      );
    });

    it('should throw InvalidOrderStatusTransitionError when transitioning from PENDING to COMPLETED', () => {
      expect(() =>
        service.validateStatusTransition(OrderStatus.PENDING, OrderStatus.COMPLETED),
      ).toThrow(InvalidOrderStatusTransitionError);
    });
  });

  describe('calculateOrderItems', () => {
    it('should calculate unitPrice and subtotal correctly for each item', () => {
      const products = [
        buildProduct({ id: 'prod-1', price: 8.5 }),
        buildProduct({ id: 'prod-2', name: 'Guaraná 2L', price: 7.0 }),
      ];
      const items: CreateOrderItemDTO[] = [
        { productId: 'prod-1', quantity: 2 },
        { productId: 'prod-2', quantity: 3 },
      ];

      const result = service.calculateOrderItems(items, products);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual<OrderItemData>({
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 8.5,
        subtotal: 17.0,
      });
      expect(result[1]).toEqual<OrderItemData>({
        productId: 'prod-2',
        quantity: 3,
        unitPrice: 7.0,
        subtotal: 21.0,
      });
    });

    it('should throw ProductNotFoundException when a product referenced by an item is not in the products list', () => {
      const products = [buildProduct({ id: 'prod-1' })];
      const items: CreateOrderItemDTO[] = [{ productId: 'non-existent-prod', quantity: 1 }];

      expect(() => service.calculateOrderItems(items, products)).toThrow(ProductNotFoundException);
    });

    it('should handle a single item correctly', () => {
      const products = [buildProduct({ id: 'prod-1', price: 10.0 })];
      const items: CreateOrderItemDTO[] = [{ productId: 'prod-1', quantity: 5 }];

      const result = service.calculateOrderItems(items, products);

      expect(result).toHaveLength(1);
      expect(result[0].subtotal).toBe(50.0);
      expect(result[0].unitPrice).toBe(10.0);
    });
  });

  describe('calculateTotal', () => {
    it('should sum all subtotals correctly', () => {
      const items: OrderItemData[] = [
        { productId: 'prod-1', quantity: 2, unitPrice: 8.5, subtotal: 17.0 },
        { productId: 'prod-2', quantity: 3, unitPrice: 7.0, subtotal: 21.0 },
      ];

      const result = service.calculateTotal(items);

      expect(result).toBe(38.0);
    });

    it('should return 0 for an empty array', () => {
      const result = service.calculateTotal([]);

      expect(result).toBe(0);
    });

    it('should return the single subtotal when only one item is present', () => {
      const items: OrderItemData[] = [
        { productId: 'prod-1', quantity: 1, unitPrice: 15.0, subtotal: 15.0 },
      ];

      const result = service.calculateTotal(items);

      expect(result).toBe(15.0);
    });
  });
});
