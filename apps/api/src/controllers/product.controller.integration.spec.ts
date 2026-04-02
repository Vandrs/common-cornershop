import 'reflect-metadata';

import Fastify, { FastifyInstance } from 'fastify';

import { ProductNotFoundException } from '../../../../libs/domain/src/errors/product-not-found.error';
import { registerErrorHandler } from '../plugins/error-handler.plugin';

import { ProductController } from './product.controller';

describe('ProductController (integration)', () => {
  let app: FastifyInstance;
  let listProductsUseCase: { execute: jest.Mock };
  let getProductUseCase: { execute: jest.Mock };
  let getStockUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    app = Fastify({ logger: false });
    registerErrorHandler(app);

    listProductsUseCase = { execute: jest.fn() };
    getProductUseCase = { execute: jest.fn() };
    getStockUseCase = { execute: jest.fn() };

    const controller = new ProductController(
      listProductsUseCase as never,
      getProductUseCase as never,
      getStockUseCase as never,
    );

    app.get('/api/products', controller.list.bind(controller));
    app.get('/api/products/:id', controller.getById.bind(controller));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should return paginated products on GET /api/products', async () => {
    // Arrange
    listProductsUseCase.execute.mockResolvedValue({
      data: [
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          name: 'Coca-Cola 2L',
          description: 'Refrigerante de cola',
          price: 8.5,
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          category: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Bebidas',
          },
          isActive: true,
          createdAt: new Date('2026-03-15T10:00:00.000Z'),
          updatedAt: new Date('2026-03-15T10:00:00.000Z'),
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/api/products?page=1&limit=10&isActive=true',
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [
        {
          id: '323e4567-e89b-12d3-a456-426614174002',
          name: 'Coca-Cola 2L',
          description: 'Refrigerante de cola',
          price: 8.5,
          categoryId: '123e4567-e89b-12d3-a456-426614174000',
          category: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Bebidas',
          },
          isActive: true,
          createdAt: '2026-03-15T10:00:00.000Z',
          updatedAt: '2026-03-15T10:00:00.000Z',
        },
      ],
      meta: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    expect(listProductsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      categoryId: undefined,
      isActive: true,
    });
  });

  it('should return ValidationError envelope for invalid query params', async () => {
    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/api/products?categoryId=invalid-uuid',
    });

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'ValidationError',
        message: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'categoryId',
          }),
        ]),
      }),
    );
  });

  it('should return ProductNotFoundException envelope when product does not exist', async () => {
    // Arrange
    getProductUseCase.execute.mockRejectedValue(new ProductNotFoundException());

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/api/products/323e4567-e89b-12d3-a456-426614174002',
    });

    // Assert
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'ProductNotFoundException',
      message: 'Produto não encontrado',
    });
  });
});
