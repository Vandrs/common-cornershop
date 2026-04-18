import 'reflect-metadata';

import Fastify from 'fastify';
import { container } from 'tsyringe';

import { registerCategoryRoutes } from './category.routes';

describe('registerCategoryRoutes', () => {
  afterEach(() => {
    container.clearInstances();
    jest.restoreAllMocks();
  });

  it('should register category GET endpoints', async () => {
    const app = Fastify({ logger: false });

    container.registerInstance('ListCategoriesUseCase', { execute: jest.fn() });
    container.registerInstance('GetCategoryUseCase', { execute: jest.fn() });

    await registerCategoryRoutes(app);

    expect(app.hasRoute({ method: 'GET', url: '/api/categories' })).toBe(true);
    expect(app.hasRoute({ method: 'GET', url: '/api/categories/:id' })).toBe(true);

    await app.close();
  });
});
