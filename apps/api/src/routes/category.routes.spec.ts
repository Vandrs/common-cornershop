import 'reflect-metadata';

import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { CategoryController } from '../controllers/category.controller';
import { registerCategoryRoutes } from './category.routes';

describe('registerCategoryRoutes', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('registers GET /api/categories and GET /api/categories/:id', async () => {
    const controller = {
      list: jest.fn(),
      getById: jest.fn(),
    } as unknown as CategoryController;

    jest.spyOn(container, 'resolve').mockReturnValue(controller);

    const get = jest.fn();
    const app = { get } as unknown as FastifyInstance;

    await registerCategoryRoutes(app);

    expect(get).toHaveBeenCalledTimes(2);
    expect(get).toHaveBeenNthCalledWith(1, '/api/categories', expect.any(Function));
    expect(get).toHaveBeenNthCalledWith(2, '/api/categories/:id', expect.any(Function));
  });
});
