import 'reflect-metadata';

import { CreateOrderUseCase, CreateOrderDTO } from './create-order.usecase';
import { ICustomerRepository } from '../../repositories/customer.repository';
import { IOrderRepository } from '../../repositories/order.repository';
import { IProductRepository } from '../../repositories/product.repository';
import { StockService } from '../../services/stock.service';
import { OrderService, OrderItemData } from '../../services/order.service';
import { CustomerNotFoundException } from '../../errors/customer-not-found.error';
import { ProductNotFoundException } from '../../errors/product-not-found.error';
import { InsufficientStockError } from '../../errors/insufficient-stock.error';
import { Customer } from '../../entities/customer.entity';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Product } from '../../entities/product.entity';
import { OrderStatus } from '../../enums/order-status.enum';

describe('CreateOrderUseCase', () => {
  let useCase: CreateOrderUseCase;
  let mockCustomerRepository: jest.Mocked<ICustomerRepository>;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockStockService: jest.Mocked<StockService>;
  let mockOrderService: jest.Mocked<OrderService>;

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

  const buildCustomer = (overrides: Partial<Customer> = {}): Customer =>
    ({
      id: 'customer-1',
      name: 'João Silva',
      email: 'joao@teste.com',
      phone: '11999990000',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Customer;

  const buildSavedOrder = (overrides: Partial<Order> = {}): Order =>
    ({
      id: 'order-new',
      customerId: 'customer-1',
      orderNumber: 'ORD-1711234567890-a3f2',
      status: OrderStatus.PENDING,
      totalAmount: 17.0,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Order;

  beforeEach(() => {
    mockCustomerRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    } as jest.Mocked<ICustomerRepository>;

    mockOrderRepository = {
      list: jest.fn(),
      findById: jest.fn(),
      createWithItems: jest.fn(),
      updateStatus: jest.fn(),
    } as jest.Mocked<IOrderRepository>;

    mockProductRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<IProductRepository>;

    mockStockService = {
      getStockByProductId: jest.fn(),
      validateSufficientStock: jest.fn(),
    } as unknown as jest.Mocked<StockService>;

    mockOrderService = {
      generateOrderNumber: jest.fn(),
      findOrFail: jest.fn(),
      validateStatusTransition: jest.fn(),
      calculateOrderItems: jest.fn(),
      calculateTotal: jest.fn(),
    } as unknown as jest.Mocked<OrderService>;

    useCase = new CreateOrderUseCase(
      mockOrderRepository,
      mockCustomerRepository,
      mockProductRepository,
      mockStockService,
      mockOrderService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create order successfully with valid items', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 2 }],
      };
      const products = [buildProduct({ id: 'prod-1', price: 8.5 })];
      const calculatedItems: OrderItemData[] = [
        { productId: 'prod-1', quantity: 2, unitPrice: 8.5, subtotal: 17.0 },
      ];
      const savedOrder = buildSavedOrder({ totalAmount: 17.0 });

      mockCustomerRepository.findById.mockResolvedValue(buildCustomer());
      mockProductRepository.findByIds.mockResolvedValue(products);
      mockStockService.validateSufficientStock.mockResolvedValue(undefined);
      mockOrderService.calculateOrderItems.mockReturnValue(calculatedItems);
      mockOrderService.calculateTotal.mockReturnValue(17.0);
      mockOrderService.generateOrderNumber.mockReturnValue('ORD-1711234567890-a3f2');
      mockOrderRepository.createWithItems.mockResolvedValue(savedOrder);

      const result = await useCase.execute(dto);

      expect(result).toEqual(savedOrder);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-1');
      expect(mockProductRepository.findByIds).toHaveBeenCalledWith(['prod-1']);
      expect(mockStockService.validateSufficientStock).toHaveBeenCalledWith('prod-1', 2);
      expect(mockOrderService.calculateOrderItems).toHaveBeenCalledWith(dto.items, products);
      expect(mockOrderService.calculateTotal).toHaveBeenCalledWith(calculatedItems);
      expect(mockOrderService.generateOrderNumber).toHaveBeenCalled();
    });

    it('should set status to PENDING on creation', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 1 }],
      };
      const products = [buildProduct({ id: 'prod-1' })];
      const calculatedItems: OrderItemData[] = [
        { productId: 'prod-1', quantity: 1, unitPrice: 8.5, subtotal: 8.5 },
      ];
      const savedOrder = buildSavedOrder({ status: OrderStatus.PENDING });

      mockCustomerRepository.findById.mockResolvedValue(buildCustomer());
      mockProductRepository.findByIds.mockResolvedValue(products);
      mockStockService.validateSufficientStock.mockResolvedValue(undefined);
      mockOrderService.calculateOrderItems.mockReturnValue(calculatedItems);
      mockOrderService.calculateTotal.mockReturnValue(8.5);
      mockOrderService.generateOrderNumber.mockReturnValue('ORD-111-aaaa');
      mockOrderRepository.createWithItems.mockResolvedValue(savedOrder);

      await useCase.execute(dto);

      expect(mockOrderRepository.createWithItems).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: 'customer-1', status: OrderStatus.PENDING }),
        expect.any(Array),
      );
    });

    it('should call createWithItems with correct order and items data', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-1',
        items: [
          { productId: 'prod-1', quantity: 2 },
          { productId: 'prod-2', quantity: 1 },
        ],
      };
      const products = [
        buildProduct({ id: 'prod-1', price: 8.5 }),
        buildProduct({ id: 'prod-2', name: 'Guaraná', price: 7.0 }),
      ];
      const calculatedItems: OrderItemData[] = [
        { productId: 'prod-1', quantity: 2, unitPrice: 8.5, subtotal: 17.0 },
        { productId: 'prod-2', quantity: 1, unitPrice: 7.0, subtotal: 7.0 },
      ];
      const savedOrder = buildSavedOrder({ totalAmount: 24.0 });

      mockCustomerRepository.findById.mockResolvedValue(buildCustomer());
      mockProductRepository.findByIds.mockResolvedValue(products);
      mockStockService.validateSufficientStock.mockResolvedValue(undefined);
      mockOrderService.calculateOrderItems.mockReturnValue(calculatedItems);
      mockOrderService.calculateTotal.mockReturnValue(24.0);
      mockOrderService.generateOrderNumber.mockReturnValue('ORD-111-bbbb');
      mockOrderRepository.createWithItems.mockResolvedValue(savedOrder);

      await useCase.execute(dto);

      expect(mockOrderRepository.createWithItems).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'customer-1',
          orderNumber: 'ORD-111-bbbb',
          status: OrderStatus.PENDING,
          totalAmount: 24.0,
        }),
        expect.arrayContaining([
          expect.objectContaining({
            productId: 'prod-1',
            quantity: 2,
            unitPrice: 8.5,
            subtotal: 17.0,
          }),
          expect.objectContaining({
            productId: 'prod-2',
            quantity: 1,
            unitPrice: 7.0,
            subtotal: 7.0,
          }),
        ]),
      );
    });

    it('should throw ProductNotFoundException when a product does not exist', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-1',
        items: [{ productId: 'non-existent-prod', quantity: 1 }],
      };

      mockCustomerRepository.findById.mockResolvedValue(buildCustomer());
      mockProductRepository.findByIds.mockResolvedValue([]);

      await expect(useCase.execute(dto)).rejects.toThrow(ProductNotFoundException);
      expect(mockStockService.validateSufficientStock).not.toHaveBeenCalled();
      expect(mockOrderRepository.createWithItems).not.toHaveBeenCalled();
    });

    it('should throw ProductNotFoundException when a product is inactive', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-1',
        items: [{ productId: 'prod-inactive', quantity: 1 }],
      };
      const inactiveProduct = buildProduct({ id: 'prod-inactive', isActive: false });

      mockCustomerRepository.findById.mockResolvedValue(buildCustomer());
      mockProductRepository.findByIds.mockResolvedValue([inactiveProduct]);

      await expect(useCase.execute(dto)).rejects.toThrow(ProductNotFoundException);
      expect(mockStockService.validateSufficientStock).not.toHaveBeenCalled();
      expect(mockOrderRepository.createWithItems).not.toHaveBeenCalled();
    });

    it('should throw InsufficientStockError when stock is insufficient', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 999 }],
      };
      const products = [buildProduct({ id: 'prod-1' })];

      mockCustomerRepository.findById.mockResolvedValue(buildCustomer());
      mockProductRepository.findByIds.mockResolvedValue(products);
      mockStockService.validateSufficientStock.mockRejectedValue(
        new InsufficientStockError('Coca-Cola 2L'),
      );

      await expect(useCase.execute(dto)).rejects.toThrow(InsufficientStockError);
      expect(mockOrderRepository.createWithItems).not.toHaveBeenCalled();
    });

    it('should build OrderItem entities with the correct data before persisting', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-1',
        items: [{ productId: 'prod-1', quantity: 3 }],
      };
      const products = [buildProduct({ id: 'prod-1', price: 10.0 })];
      const calculatedItems: OrderItemData[] = [
        { productId: 'prod-1', quantity: 3, unitPrice: 10.0, subtotal: 30.0 },
      ];

      mockCustomerRepository.findById.mockResolvedValue(buildCustomer());
      mockProductRepository.findByIds.mockResolvedValue(products);
      mockStockService.validateSufficientStock.mockResolvedValue(undefined);
      mockOrderService.calculateOrderItems.mockReturnValue(calculatedItems);
      mockOrderService.calculateTotal.mockReturnValue(30.0);
      mockOrderService.generateOrderNumber.mockReturnValue('ORD-222-cccc');
      mockOrderRepository.createWithItems.mockResolvedValue(buildSavedOrder());

      await useCase.execute(dto);

      const [, passedItems] = mockOrderRepository.createWithItems.mock.calls[0] as [
        Order,
        OrderItem[],
      ];
      expect(passedItems).toHaveLength(1);
      expect(passedItems[0]).toBeInstanceOf(OrderItem);
      expect(passedItems[0].productId).toBe('prod-1');
      expect(passedItems[0].quantity).toBe(3);
      expect(passedItems[0].unitPrice).toBe(10.0);
      expect(passedItems[0].subtotal).toBe(30.0);
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      const dto: CreateOrderDTO = {
        customerId: 'customer-missing',
        items: [{ productId: 'prod-1', quantity: 1 }],
      };

      mockCustomerRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(CustomerNotFoundException);
      expect(mockProductRepository.findByIds).not.toHaveBeenCalled();
      expect(mockStockService.validateSufficientStock).not.toHaveBeenCalled();
      expect(mockOrderRepository.createWithItems).not.toHaveBeenCalled();
    });
  });
});
