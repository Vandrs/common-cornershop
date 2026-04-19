import 'reflect-metadata';

import Fastify from 'fastify';
import { container } from 'tsyringe';

import { registerCustomerRoutes } from './customer.routes';

describe('registerCustomerRoutes', () => {
  afterEach(() => {
    container.clearInstances();
    jest.restoreAllMocks();
  });

  it('should register customer POST and GET endpoints', async () => {
    const app = Fastify({ logger: false });

    container.registerInstance('CreateCustomerUseCase', { execute: jest.fn() });
    container.registerInstance('GetCustomerUseCase', { execute: jest.fn() });

    await registerCustomerRoutes(app);

    expect(app.hasRoute({ method: 'POST', url: '/api/customers' })).toBe(true);
    expect(app.hasRoute({ method: 'GET', url: '/api/customers/:id' })).toBe(true);

    await app.close();
  });
});
