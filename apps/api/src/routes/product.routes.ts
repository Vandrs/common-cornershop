import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { ProductController } from '../controllers/product.controller';
import { httpSchemaRef } from '../plugins/http-schemas.plugin';

/**
 * Registers Product HTTP routes.
 */
export async function registerProductRoutes(app: FastifyInstance): Promise<void> {
  const controller = container.resolve(ProductController);

  app.get(
    '/api/products',
    {
      schema: {
        tags: ['Products'],
        summary: 'Lista produtos',
        operationId: 'listProducts',
        querystring: { $ref: httpSchemaRef('ProductsListQuery') },
        response: {
          200: { $ref: httpSchemaRef('ProductsListResponse') },
          400: { $ref: httpSchemaRef('ValidationErrorResponse') },
          500: { $ref: httpSchemaRef('InternalServerErrorResponse') },
        },
      },
    },
    controller.list.bind(controller),
  );

  app.get(
    '/api/products/:id',
    {
      schema: {
        tags: ['Products'],
        summary: 'Busca produto por id',
        operationId: 'getProductById',
        params: { $ref: httpSchemaRef('ProductsParams') },
        response: {
          200: { $ref: httpSchemaRef('ProductResponse') },
          400: { $ref: httpSchemaRef('ValidationErrorResponse') },
          404: { $ref: httpSchemaRef('ProductNotFoundResponse') },
          500: { $ref: httpSchemaRef('InternalServerErrorResponse') },
        },
      },
    },
    controller.getById.bind(controller),
  );
}
