import { FastifyReply } from 'fastify';

import { Order } from '@domain/entities/order.entity';
import { OrderStatus } from '@domain/enums/order-status.enum';
import { CancelOrderUseCase } from '@domain/use-cases/orders/cancel-order.usecase';
import { CreateOrderUseCase } from '@domain/use-cases/orders/create-order.usecase';
import { GetOrderUseCase } from '@domain/use-cases/orders/get-order.usecase';
import { ListOrdersUseCase } from '@domain/use-cases/orders/list-orders.usecase';
import { UpdateOrderStatusUseCase } from '@domain/use-cases/orders/update-order-status.usecase';

import { OrderController } from './order.controller';

const makeOrder = (): Order => {
  const order = new Order();
  order.id = '123e4567-e89b-12d3-a456-426614174000';
  order.customerId = '223e4567-e89b-12d3-a456-426614174001';
  order.orderNumber = 'ORD-1710501234567-A3F9';
  order.status = OrderStatus.PENDING;
  order.totalAmount = 24.5;
  order.createdAt = new Date('2026-03-15T15:00:00.000Z');
  order.updatedAt = new Date('2026-03-15T15:00:00.000Z');
  order.items = [
    {
      id: '723e4567-e89b-12d3-a456-426614174006',
      productId: '323e4567-e89b-12d3-a456-426614174002',
      quantity: 2,
      unitPrice: 8.5,
      subtotal: 17,
      product: {
        id: '323e4567-e89b-12d3-a456-426614174002',
        name: 'Coca-Cola 2L',
        price: 8.5,
      },
    },
  ] as unknown as Order['items'];

  return order;
};

describe('OrderController', () => {
  let createOrderUseCase: jest.Mocked<CreateOrderUseCase>;
  let getOrderUseCase: jest.Mocked<GetOrderUseCase>;
  let listOrdersUseCase: jest.Mocked<ListOrdersUseCase>;
  let updateOrderStatusUseCase: jest.Mocked<UpdateOrderStatusUseCase>;
  let cancelOrderUseCase: jest.Mocked<CancelOrderUseCase>;
  let controller: OrderController;

  beforeEach(() => {
    createOrderUseCase = { execute: jest.fn() } as unknown as jest.Mocked<CreateOrderUseCase>;
    getOrderUseCase = { execute: jest.fn() } as unknown as jest.Mocked<GetOrderUseCase>;
    listOrdersUseCase = { execute: jest.fn() } as unknown as jest.Mocked<ListOrdersUseCase>;
    updateOrderStatusUseCase = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<UpdateOrderStatusUseCase>;
    cancelOrderUseCase = { execute: jest.fn() } as unknown as jest.Mocked<CancelOrderUseCase>;

    controller = new OrderController(
      createOrderUseCase,
      getOrderUseCase,
      listOrdersUseCase,
      updateOrderStatusUseCase,
      cancelOrderUseCase,
    );
  });

  it('should create order and return 201 response', async () => {
    const order = makeOrder();
    createOrderUseCase.execute.mockResolvedValue(order);

    const request = {
      body: {
        customerId: '223e4567-e89b-12d3-a456-426614174001',
        items: [{ productId: '323e4567-e89b-12d3-a456-426614174002', quantity: 2 }],
      },
    } as unknown;

    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const reply = { status } as unknown as FastifyReply;

    await controller.create(request as never, reply);

    expect(createOrderUseCase.execute).toHaveBeenCalledWith({
      customerId: '223e4567-e89b-12d3-a456-426614174001',
      items: [{ productId: '323e4567-e89b-12d3-a456-426614174002', quantity: 2 }],
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: order.id,
        status: OrderStatus.PENDING,
        totalAmount: 24.5,
      }),
    );
  });

  it('should update order status and return status payload', async () => {
    const updatedOrder = makeOrder();
    updatedOrder.status = OrderStatus.PROCESSING;
    updateOrderStatusUseCase.execute.mockResolvedValue(updatedOrder);

    const request = {
      params: { id: updatedOrder.id },
      body: { status: OrderStatus.PROCESSING },
    } as unknown;

    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const reply = { status } as unknown as FastifyReply;

    await controller.updateStatus(request as never, reply);

    expect(updateOrderStatusUseCase.execute).toHaveBeenCalledWith({
      id: updatedOrder.id,
      status: OrderStatus.PROCESSING,
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith({
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      status: OrderStatus.PROCESSING,
    });
  });
});
