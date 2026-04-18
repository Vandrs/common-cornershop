import { FastifyInstance } from 'fastify';

import { Stock } from '@domain/entities/stock.entity';

import { AppDataSource } from '../../database/data-source';

import { OrderFactory } from './factories/order.factory';
import { E2ETestSetup } from './setup';

describe('API E2E - core flows with fixtures/factories', () => {
  let app: FastifyInstance;
  const e2e = new E2ETestSetup();

  beforeAll(async () => {
    app = await e2e.init();
  });

  beforeEach(async () => {
    await e2e.resetState();
  });

  afterAll(async () => {
    await e2e.teardown();
  });

  it('should execute full happy path: list categories/products, create order and fetch order', async () => {
    // Arrange
    const category = await e2e.fixtures.createCategory({
      name: 'Bebidas',
      description: 'Refrigerantes e sucos',
    });

    const cola = await e2e.fixtures.createProductWithStock({
      categoryId: category.id,
      name: 'Coca-Cola 2L',
      price: 8.5,
      stockQuantity: 10,
      minimumQuantity: 2,
    });

    const guarana = await e2e.fixtures.createProductWithStock({
      categoryId: category.id,
      name: 'Guaraná 2L',
      price: 7.5,
      stockQuantity: 7,
      minimumQuantity: 1,
    });

    // Act - categories
    const listCategoriesResponse = await app.inject({
      method: 'GET',
      url: '/api/categories?page=1&limit=10',
    });

    // Assert - categories contract
    expect(listCategoriesResponse.statusCode).toBe(200);
    expect(listCategoriesResponse.json()).toEqual({
      data: [
        expect.objectContaining({
          id: category.id,
          name: 'Bebidas',
          description: 'Refrigerantes e sucos',
          isActive: true,
        }),
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    // Act - products
    const listProductsResponse = await app.inject({
      method: 'GET',
      url: `/api/products?page=1&limit=10&categoryId=${category.id}&isActive=true`,
    });

    // Assert - products contract
    expect(listProductsResponse.statusCode).toBe(200);
    expect(listProductsResponse.json()).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: cola.product.id,
          name: 'Coca-Cola 2L',
          price: 8.5,
          categoryId: category.id,
        }),
        expect.objectContaining({
          id: guarana.product.id,
          name: 'Guaraná 2L',
          price: 7.5,
          categoryId: category.id,
        }),
      ]),
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });

    // Act - create order
    const createOrderResponse = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: OrderFactory.buildCreatePayload([
        { productId: cola.product.id, quantity: 2 },
        { productId: guarana.product.id, quantity: 1 },
      ]),
    });

    // Assert - create order contract
    expect(createOrderResponse.statusCode).toBe(201);
    const createdOrder = createOrderResponse.json();

    expect(createdOrder).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        orderNumber: expect.stringMatching(/^ORD-/),
        status: 'PENDING',
        totalAmount: 24.5,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: cola.product.id,
            quantity: 2,
            unitPrice: 8.5,
            subtotal: 17,
            product: expect.objectContaining({
              id: cola.product.id,
              name: 'Coca-Cola 2L',
              price: 8.5,
            }),
          }),
          expect.objectContaining({
            productId: guarana.product.id,
            quantity: 1,
            unitPrice: 7.5,
            subtotal: 7.5,
            product: expect.objectContaining({
              id: guarana.product.id,
              name: 'Guaraná 2L',
              price: 7.5,
            }),
          }),
        ]),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      }),
    );

    // Act - get order by id
    const getOrderResponse = await app.inject({
      method: 'GET',
      url: `/api/orders/${createdOrder.id}`,
    });

    // Assert - get order contract
    expect(getOrderResponse.statusCode).toBe(200);
    expect(getOrderResponse.json()).toEqual(
      expect.objectContaining({
        id: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
        status: 'PENDING',
        totalAmount: 24.5,
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: cola.product.id,
            quantity: 2,
            unitPrice: 8.5,
            subtotal: 17,
            product: expect.objectContaining({
              id: cola.product.id,
              name: 'Coca-Cola 2L',
            }),
          }),
          expect.objectContaining({
            productId: guarana.product.id,
            quantity: 1,
            unitPrice: 7.5,
            subtotal: 7.5,
            product: expect.objectContaining({
              id: guarana.product.id,
              name: 'Guaraná 2L',
            }),
          }),
        ]),
      }),
    );

    // Assert - stock remains consistent (current behavior does not decrement on order creation)
    const stockRepository = AppDataSource.getRepository(Stock);
    const updatedColaStock = await stockRepository.findOne({
      where: { productId: cola.product.id },
    });
    const updatedGuaranaStock = await stockRepository.findOne({
      where: { productId: guarana.product.id },
    });

    expect(updatedColaStock?.quantity).toBe(10);
    expect(updatedGuaranaStock?.quantity).toBe(7);
  });

  it('should return standardized validation contract for invalid product query', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/products?categoryId=invalid-uuid',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'ValidationError',
        message: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'categoryId',
            message: expect.any(String),
          }),
        ]),
      }),
    );
  });

  it('should return standardized domain error when creating order with insufficient stock', async () => {
    const category = await e2e.fixtures.createCategory({ name: 'Mercearia' });
    const item = await e2e.fixtures.createProductWithStock({
      categoryId: category.id,
      name: 'Arroz 5kg',
      price: 30,
      stockQuantity: 1,
      minimumQuantity: 0,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
      payload: OrderFactory.buildCreatePayload([{ productId: item.product.id, quantity: 2 }]),
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'InsufficientStockError',
      message: 'Estoque insuficiente',
    });
  });

  it('should return standardized domain error when order is not found', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/orders/9f1f50a8-3df7-49ba-8397-f5fd027974db',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'OrderNotFoundException',
      message: 'Pedido não encontrado',
    });
  });
});
