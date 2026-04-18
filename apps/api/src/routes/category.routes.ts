import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { CategoryController } from '../controllers/category.controller';
import { httpSchemaRef } from '../plugins/http-schemas.plugin';

/**
 * Registers Category HTTP routes.
 */
export async function registerCategoryRoutes(app: FastifyInstance): Promise<void> {
  const controller = container.resolve(CategoryController) as CategoryController;

  app.get(
    '/api/categories',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Lista categorias',
        operationId: 'listCategories',
        querystring: { $ref: httpSchemaRef('CategoriesListQuery') },
        response: {
          200: { $ref: httpSchemaRef('CategoriesListResponse') },
          400: { $ref: httpSchemaRef('ValidationErrorResponse') },
          500: { $ref: httpSchemaRef('InternalServerErrorResponse') },
        },
      },
    },
    controller.list.bind(controller),
  );

  app.get(
    '/api/categories/:id',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Busca categoria por id',
        operationId: 'getCategoryById',
        params: { $ref: httpSchemaRef('CategoriesParams') },
        response: {
          200: { $ref: httpSchemaRef('CategoryResponse') },
          400: { $ref: httpSchemaRef('ValidationErrorResponse') },
          404: { $ref: httpSchemaRef('CategoryNotFoundResponse') },
          500: { $ref: httpSchemaRef('InternalServerErrorResponse') },
        },
      },
    },
    controller.getById.bind(controller),
  );
}
