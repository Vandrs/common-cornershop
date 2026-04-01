import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { CategoryController } from '../controllers/category.controller';

export async function registerCategoryRoutes(app: FastifyInstance): Promise<void> {
  const controller = container.resolve(CategoryController) as CategoryController;

  app.get('/api/categories', controller.list.bind(controller));
  app.get('/api/categories/:id', controller.getById.bind(controller));
}
