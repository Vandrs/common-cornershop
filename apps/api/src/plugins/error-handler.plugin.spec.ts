import Fastify, { FastifyInstance } from 'fastify';
import { z } from 'zod';

import {
  ProductNotFoundException,
  CategoryNotFoundException,
  InsufficientStockError,
  OrderNotFoundException,
  InvalidOrderStatusTransitionError,
  CustomerNotFoundException,
  CustomerAlreadyExistsException,
} from '@domain/index';
import { OrderStatus } from '@domain/enums/order-status.enum';

import { registerErrorHandler } from './error-handler.plugin';

/**
 * Builds a minimal Fastify instance with the error handler registered and a
 * test route that throws the provided error synchronously.
 *
 * Using Fastify's `inject` keeps the tests in-process (no real HTTP port needed)
 * while still exercising the complete request/response pipeline.
 */
async function buildApp(throwFn: () => Error): Promise<FastifyInstance> {
  const app = Fastify({ logger: false });
  registerErrorHandler(app);

  app.get('/test', async () => {
    throw throwFn();
  });

  await app.ready();
  return app;
}

describe('registerErrorHandler', () => {
  describe('when a mapped DomainError is thrown', () => {
    it('maps ProductNotFoundException to 404 with correct envelope', async () => {
      const app = await buildApp(() => new ProductNotFoundException());

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'ProductNotFoundException',
        message: 'Produto não encontrado',
      });
      expect(body).not.toHaveProperty('statusCode');
      expect(body).not.toHaveProperty('stack');
    });

    it('maps CategoryNotFoundException to 404 with correct envelope', async () => {
      const app = await buildApp(() => new CategoryNotFoundException());

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'CategoryNotFoundException',
        message: 'Categoria não encontrada',
      });
    });

    it('maps InsufficientStockError to 400 with correct envelope', async () => {
      const app = await buildApp(() => new InsufficientStockError('Coca-Cola 2L'));

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'InsufficientStockError',
        message: 'Estoque insuficiente',
      });
    });

    it('maps OrderNotFoundException to 404 with correct envelope', async () => {
      const app = await buildApp(() => new OrderNotFoundException());

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'OrderNotFoundException',
        message: 'Pedido não encontrado',
      });
    });

    it('maps CustomerNotFoundException to 404 with correct envelope', async () => {
      const app = await buildApp(() => new CustomerNotFoundException());

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'CustomerNotFoundException',
        message: 'Cliente não encontrado',
      });
    });

    it('maps CustomerAlreadyExistsException to 409 with correct envelope', async () => {
      const app = await buildApp(() => new CustomerAlreadyExistsException());

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'CustomerAlreadyExistsException',
        message: 'Cliente já cadastrado',
      });
    });

    it('maps InvalidOrderStatusTransitionError to 400 with correct envelope', async () => {
      const app = await buildApp(
        () => new InvalidOrderStatusTransitionError(OrderStatus.COMPLETED, OrderStatus.PENDING),
      );

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'InvalidOrderStatusTransitionError',
        message: 'Transição de status inválida para o pedido',
      });
    });

    it('does not expose stack trace for domain errors', async () => {
      const app = await buildApp(() => new ProductNotFoundException());

      const response = await app.inject({ method: 'GET', url: '/test' });

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('stack');
      expect(JSON.stringify(body)).not.toContain('at ');
    });
  });

  describe('when a ZodError is thrown', () => {
    it('returns 400 with ValidationError envelope and details array', async () => {
      const schema = z.object({
        items: z.array(z.object({ quantity: z.number().int().positive() })).min(1),
      });

      const app = await buildApp(() => {
        const result = schema.safeParse({});
        if (!result.success) return result.error;
        return new Error('should not reach here');
      });

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('ValidationError');
      expect(body.message).toBe('Dados inválidos');
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThan(0);
      expect(body.details[0]).toHaveProperty('field');
      expect(body.details[0]).toHaveProperty('message');
    });

    it('includes path-based field names in details', async () => {
      const schema = z.object({ name: z.string().min(1) });
      const app = await buildApp(() => {
        const result = schema.safeParse({ name: '' });
        if (!result.success) return result.error;
        return new Error('should not reach here');
      });

      const response = await app.inject({ method: 'GET', url: '/test' });

      const body = JSON.parse(response.body);
      const nameDetail = body.details.find((d: { field: string }) => d.field === 'name');
      expect(nameDetail).toBeDefined();
    });

    it('does not expose stack trace for ZodErrors', async () => {
      const schema = z.object({ id: z.string().uuid() });
      const app = await buildApp(() => {
        const result = schema.safeParse({ id: 'not-a-uuid' });
        if (!result.success) return result.error;
        return new Error('should not reach here');
      });

      const response = await app.inject({ method: 'GET', url: '/test' });

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('stack');
    });
  });

  describe('when an unexpected / generic error is thrown', () => {
    it('returns 500 with InternalServerError envelope', async () => {
      const app = await buildApp(() => new Error('Something went wrong internally'));

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        error: 'InternalServerError',
        message: 'Erro interno do servidor',
      });
    });

    it('does not expose the internal error message or stack trace', async () => {
      const sensitiveMessage = 'DB connection string: postgresql://user:secret@host/db';
      const app = await buildApp(() => new Error(sensitiveMessage));

      const response = await app.inject({ method: 'GET', url: '/test' });

      expect(response.statusCode).toBe(500);
      const rawBody = response.body;
      expect(rawBody).not.toContain(sensitiveMessage);
      expect(rawBody).not.toContain('stack');
      expect(rawBody).not.toContain('at ');
    });

    it('does not include statusCode in the response body', async () => {
      const app = await buildApp(() => new Error('generic'));

      const response = await app.inject({ method: 'GET', url: '/test' });

      const body = JSON.parse(response.body);
      expect(body).not.toHaveProperty('statusCode');
    });
  });
});
