import 'reflect-metadata';

import Fastify, { FastifyInstance } from 'fastify';

import { CategoryNotFoundException } from '../../../../libs/domain/src/errors/category-not-found.error';

import { registerErrorHandler } from '../plugins/error-handler.plugin';

import { CategoryController } from './category.controller';

describe('CategoryController (integration)', () => {
  let app: FastifyInstance;
  let listCategoriesUseCase: { execute: jest.Mock };
  let getCategoryUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    app = Fastify({ logger: false });
    registerErrorHandler(app);

    listCategoriesUseCase = { execute: jest.fn() };
    getCategoryUseCase = { execute: jest.fn() };

    const controller = new CategoryController(
      listCategoriesUseCase as never,
      getCategoryUseCase as never,
    );

    app.get('/api/categories', controller.list.bind(controller));
    app.get('/api/categories/:id', controller.getById.bind(controller));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should return paginated categories on GET /api/categories', async () => {
    // Arrange
    listCategoriesUseCase.execute.mockResolvedValue({
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Bebidas',
          description: 'Refrigerantes e sucos',
          isActive: true,
          createdAt: '2026-03-15T10:00:00.000Z',
          updatedAt: '2026-03-15T10:00:00.000Z',
        },
      ],
      meta: {
        page: 2,
        limit: 5,
        total: 11,
        totalPages: 3,
      },
    });

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories?page=2&limit=5',
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Bebidas',
          description: 'Refrigerantes e sucos',
          isActive: true,
          createdAt: '2026-03-15T10:00:00.000Z',
          updatedAt: '2026-03-15T10:00:00.000Z',
        },
      ],
      meta: {
        page: 2,
        limit: 5,
        total: 11,
        totalPages: 3,
      },
    });
    expect(listCategoriesUseCase.execute).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });

  it('should return ValidationError envelope for invalid query params', async () => {
    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories?limit=101',
    });

    // Assert
    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'ValidationError',
        message: 'Dados inválidos',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'limit',
          }),
        ]),
      }),
    );
  });

  it('should return CategoryNotFoundException envelope when category does not exist', async () => {
    // Arrange
    getCategoryUseCase.execute.mockRejectedValue(new CategoryNotFoundException());

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/api/categories/123e4567-e89b-12d3-a456-426614174000',
    });

    // Assert
    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'CategoryNotFoundException',
      message: 'Categoria não encontrada',
    });
  });
});
