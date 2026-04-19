import 'reflect-metadata';

import Fastify, { FastifyInstance } from 'fastify';

import { InsufficientStockError } from '@domain/errors/insufficient-stock.error';
import { OrderNotFoundException } from '@domain/errors/order-not-found.error';
import { registerErrorHandler } from '../../plugins/error-handler.plugin';

import { OrderController } from './order.controller';

describe('OrderController (integration)', () => {
  let app: FastifyInstance;
  let createOrderUseCase: { execute: jest.Mock };
  let getOrderUseCase: { execute: jest.Mock };
  let listOrdersUseCase: { execute: jest.Mock };
  let updateOrderStatusUseCase: { execute: jest.Mock };
  let cancelOrderUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    app = Fastify({ logger: false });
    registerErrorHandler(app);

    createOrderUseCase = { execute: jest.fn() };
    getOrderUseCase = { execute: jest.fn() };
    listOrdersUseCase = { execute: jest.fn() };
    updateOrderStatusUseCase = { execute: jest.fn() };
    cancelOrderUseCase = { execute: jest.fn() };

    const controller = new OrderController(
      createOrderUseCase as never,
      getOrderUseCase as never,
      listOrdersUseCase as never,
      updateOrderStatusUseCase as never,
      cancelOrderUseCase as never,
    );

    app.post('/api/orders', controller.create.bind(controller));
    app.get('/api/orders', controller.list.bind(controller));
    app.get('/api/orders/:id', controller.getById.bind(controller));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should create order on POST /api/orders', async () => {
    createOrderUseCase.execute.mockResolvedValue({
      id: '623e4567-e89b-12d3-a456-426614174005',
      orderNumber: 'ORD-1710501234567-A3F9',
      status: 'PENDING',
      totalAmount: 24.5,
      items: [
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
      ],
      createdAt: new Date('2026-03-15T15:00:00.000Z'),
      updatedAt: new Date('2026-03-15T15:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {
        customerId: '223e4567-e89b-12d3-a456-426614174001',
        items: [{ productId: '323e4567-e89b-12d3-a456-426614174002', quantity: 2 }],
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createOrderUseCase.execute).toHaveBeenCalledWith({
      customerId: '223e4567-e89b-12d3-a456-426614174001',
      items: [{ productId: '323e4567-e89b-12d3-a456-426614174002', quantity: 2 }],
    });
    expect(response.json()).toEqual({
      id: '623e4567-e89b-12d3-a456-426614174005',
      orderNumber: 'ORD-1710501234567-A3F9',
      status: 'PENDING',
      totalAmount: 24.5,
      items: [
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
      ],
      createdAt: '2026-03-15T15:00:00.000Z',
      updatedAt: '2026-03-15T15:00:00.000Z',
    });
  });

  it('should return ValidationError envelope for invalid create payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'ValidationError',
        message: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'items',
          }),
        ]),
      }),
    );
  });

  it('should return InsufficientStockError envelope when stock is insufficient', async () => {
    createOrderUseCase.execute.mockRejectedValue(new InsufficientStockError('Coca-Cola 2L'));

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: {
        customerId: '223e4567-e89b-12d3-a456-426614174001',
        items: [{ productId: '323e4567-e89b-12d3-a456-426614174002', quantity: 2 }],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'InsufficientStockError',
      message: 'Estoque insuficiente',
    });
  });

  it('should return order list on GET /api/orders and parse filters', async () => {
    listOrdersUseCase.execute.mockResolvedValue({
      data: [
        {
          id: '623e4567-e89b-12d3-a456-426614174005',
          orderNumber: 'ORD-1710501234567-A3F9',
          status: 'PENDING',
          totalAmount: 24.5,
          itemsCount: 1,
          createdAt: new Date('2026-03-15T15:00:00.000Z'),
          updatedAt: new Date('2026-03-15T15:00:00.000Z'),
          items: [],
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/orders?page=1&limit=10&status=PENDING&dateFrom=2026-03-01T00:00:00.000Z&dateTo=2026-03-31T23:59:59.000Z',
    });

    expect(response.statusCode).toBe(200);
    expect(listOrdersUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      status: 'PENDING',
      createdAfter: new Date('2026-03-01T00:00:00.000Z'),
      createdBefore: new Date('2026-03-31T23:59:59.000Z'),
    });
    expect(response.json()).toEqual({
      data: [
        {
          id: '623e4567-e89b-12d3-a456-426614174005',
          orderNumber: 'ORD-1710501234567-A3F9',
          status: 'PENDING',
          totalAmount: 24.5,
          itemsCount: 1,
          createdAt: '2026-03-15T15:00:00.000Z',
          updatedAt: '2026-03-15T15:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('should return ValidationError envelope for invalid list filters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/orders?status=INVALID',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'ValidationError',
        message: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'status',
          }),
        ]),
      }),
    );
  });

  it('should return OrderNotFoundException envelope on GET /api/orders/:id', async () => {
    getOrderUseCase.execute.mockRejectedValue(new OrderNotFoundException());

    const response = await app.inject({
      method: 'GET',
      url: '/api/orders/623e4567-e89b-12d3-a456-426614174005',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'OrderNotFoundException',
      message: 'Pedido não encontrado',
    });
  });
});
