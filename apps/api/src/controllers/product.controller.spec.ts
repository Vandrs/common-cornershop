import 'reflect-metadata';

import { FastifyReply, FastifyRequest } from 'fastify';

import { ProductController } from './product.controller';

describe('ProductController', () => {
  const baseProduct = {
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
  };

  const baseStock = {
    id: '523e4567-e89b-12d3-a456-426614174004',
    productId: '323e4567-e89b-12d3-a456-426614174002',
    quantity: 45,
    minimumQuantity: 10,
    lastUpdatedAt: new Date('2026-03-15T14:30:00.000Z'),
  };

  const buildReply = (): FastifyReply => {
    const reply = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    return reply as unknown as FastifyReply;
  };

  it('should list products with parsed filters', async () => {
    const listProductsUseCase = {
      execute: jest.fn().mockResolvedValue({
        data: [baseProduct],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      }),
    };

    const controller = new ProductController(
      listProductsUseCase as never,
      { execute: jest.fn() } as never,
      { execute: jest.fn() } as never,
    );

    const request = {
      query: {
        page: '1',
        limit: '10',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        isActive: 'true',
      },
    } as unknown as FastifyRequest;
    const reply = buildReply();

    await controller.list(request, reply);

    expect(listProductsUseCase.execute).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      categoryId: '123e4567-e89b-12d3-a456-426614174000',
      isActive: true,
    });
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      data: [
        {
          ...baseProduct,
          createdAt: '2026-03-15T10:00:00.000Z',
          updatedAt: '2026-03-15T10:00:00.000Z',
        },
      ],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });
  });

  it('should return product by id with stock data', async () => {
    const getProductUseCase = {
      execute: jest.fn().mockResolvedValue(baseProduct),
    };
    const getStockUseCase = {
      execute: jest.fn().mockResolvedValue(baseStock),
    };

    const controller = new ProductController(
      { execute: jest.fn() } as never,
      getProductUseCase as never,
      getStockUseCase as never,
    );

    const request = {
      params: {
        id: '323e4567-e89b-12d3-a456-426614174002',
      },
    } as unknown as FastifyRequest;
    const reply = buildReply();

    await controller.getById(request, reply);

    expect(getProductUseCase.execute).toHaveBeenCalledWith('323e4567-e89b-12d3-a456-426614174002');
    expect(getStockUseCase.execute).toHaveBeenCalledWith('323e4567-e89b-12d3-a456-426614174002');
    expect(reply.status).toHaveBeenCalledWith(200);
    expect(reply.send).toHaveBeenCalledWith({
      ...baseProduct,
      createdAt: '2026-03-15T10:00:00.000Z',
      updatedAt: '2026-03-15T10:00:00.000Z',
      stock: {
        ...baseStock,
        lastUpdatedAt: '2026-03-15T14:30:00.000Z',
      },
    });
  });
});
