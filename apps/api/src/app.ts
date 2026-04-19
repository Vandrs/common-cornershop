import 'reflect-metadata';

import Fastify, { FastifyInstance } from 'fastify';

import { registerOrderRoutes } from './http/routes/order.routes';
import { registerDependencies } from './container/dependency-injection';
import { registerProductRoutes } from './routes/product.routes';
import { registerCategoryRoutes } from './routes/category.routes';
import { registerCustomerRoutes } from './routes/customer.routes';
import { registerErrorHandler } from './plugins/error-handler.plugin';
import { registerHttpSchemas } from './plugins/http-schemas.plugin';
import { registerSwagger } from './plugins/swagger.plugin';

/**
 * Factory function that builds and configures the Fastify application.
 *
 * Responsibilities (SRP — each step is isolated):
 *  1. Register TSyringe DI bindings so the container is ready before any
 *     route handler resolves a dependency.
 *  2. Register the global error handler (ADR-0002).
 *  3. Return the configured instance for the caller (`main.ts`) to start.
 *
 * Returning the instance (instead of calling `listen` here) keeps the factory
 * unit-testable: tests can inject routes or call `app.inject()` without
 * binding to a real port.
 *
 * @returns Configured, ready-to-listen Fastify instance.
 */
export async function createApp(): Promise<FastifyInstance> {
  // Register all DI bindings before the app processes any request.
  registerDependencies();

  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
    },
  });

  // Register the centralised error handler (ADR-0002).
  registerErrorHandler(app);

  await registerSwagger(app);
  await registerHttpSchemas(app);
  await registerProductRoutes(app);
  await registerCategoryRoutes(app);
  await registerCustomerRoutes(app);
  await registerOrderRoutes(app);

  return app;
}
