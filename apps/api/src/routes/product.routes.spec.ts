import 'reflect-metadata';

import Fastify from 'fastify';
import { container } from 'tsyringe';

import { registerProductRoutes } from './product.routes';

describe('registerProductRoutes', () => {
  afterEach(() => {
    container.clearInstances();
    jest.restoreAllMocks();
  });

  it('should register product GET endpoints', async () => {
    const app = Fastify({ logger: false });

    container.registerInstance('ListProductsUseCase', { execute: jest.fn() });
    container.registerInstance('GetProductUseCase', { execute: jest.fn() });
    container.registerInstance('GetStockUseCase', { execute: jest.fn() });

    await registerProductRoutes(app);

    expect(app.hasRoute({ method: 'GET', url: '/api/products' })).toBe(true);
    expect(app.hasRoute({ method: 'GET', url: '/api/products/:id' })).toBe(true);

    await app.close();
  });
});
