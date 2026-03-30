import Fastify from 'fastify';

import {
  createOrderBodySchema,
  idParamSchema,
  listOrdersQuerySchema,
  listProductsQuerySchema,
} from '../index';
import { registerErrorHandler } from '../../../plugins/error-handler.plugin';

describe('http zod schemas', () => {
  describe('listProductsQuerySchema', () => {
    it('parses valid query params', () => {
      const parsed = listProductsQuerySchema.parse({
        page: '1',
        limit: '20',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        isActive: 'true',
      });

      expect(parsed).toEqual({
        page: 1,
        limit: 20,
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        isActive: true,
      });
    });

    it('rejects invalid category UUID', () => {
      expect(() =>
        listProductsQuerySchema.parse({
          categoryId: 'invalid-uuid',
        }),
      ).toThrow();
    });

    it('rejects pagination above max limit', () => {
      expect(() =>
        listProductsQuerySchema.parse({
          page: '1',
          limit: '101',
        }),
      ).toThrow();
    });
  });

  describe('createOrderBodySchema', () => {
    it('parses valid create order payload', () => {
      const parsed = createOrderBodySchema.parse({
        items: [{ productId: '323e4567-e89b-12d3-a456-426614174002', quantity: 2 }],
      });

      expect(parsed.items).toHaveLength(1);
      expect(parsed.items[0].quantity).toBe(2);
    });

    it('rejects empty items list', () => {
      expect(() => createOrderBodySchema.parse({ items: [] })).toThrow();
    });
  });

  describe('listOrdersQuerySchema', () => {
    it('rejects invalid status enum', () => {
      expect(() =>
        listOrdersQuerySchema.parse({
          status: 'UNKNOWN',
        }),
      ).toThrow();
    });
  });

  describe('validation errors through error handler', () => {
    it('returns standard envelope for invalid UUID params', async () => {
      const app = Fastify({ logger: false });
      registerErrorHandler(app);

      app.get('/test/:id', async (request) => {
        idParamSchema.parse(request.params);
        return { ok: true };
      });

      const response = await app.inject({
        method: 'GET',
        url: '/test/not-a-uuid',
      });

      expect(response.statusCode).toBe(400);

      const body = JSON.parse(response.body) as {
        error: string;
        message: string;
        details: Array<{ field: string; message: string }>;
      };

      expect(body.error).toBe('ValidationError');
      expect(body.message).toBe('Dados inválidos');
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThan(0);
      expect(body.details[0]).toHaveProperty('field');
      expect(body.details[0]).toHaveProperty('message');

      await app.close();
    });
  });
});
