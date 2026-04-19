import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import { CustomerController } from '../controllers/customer.controller';
import { httpSchemaRef } from '../plugins/http-schemas.plugin';

/**
 * Registers Customer HTTP routes.
 */
export async function registerCustomerRoutes(app: FastifyInstance): Promise<void> {
  const controller = container.resolve(CustomerController);

  app.post(
    '/api/customers',
    {
      schema: {
        tags: ['Customers'],
        summary: 'Cria cliente',
        operationId: 'createCustomer',
        body: { $ref: httpSchemaRef('CustomersCreateBody') },
        response: {
          201: { $ref: httpSchemaRef('CustomerResponse') },
          400: { $ref: httpSchemaRef('ValidationErrorResponse') },
          409: { $ref: httpSchemaRef('CustomerAlreadyExistsResponse') },
          500: { $ref: httpSchemaRef('InternalServerErrorResponse') },
        },
      },
    },
    controller.create.bind(controller),
  );

  app.get(
    '/api/customers/:id',
    {
      schema: {
        tags: ['Customers'],
        summary: 'Busca cliente por id',
        operationId: 'getCustomerById',
        params: { $ref: httpSchemaRef('CustomersParams') },
        response: {
          200: { $ref: httpSchemaRef('CustomerResponse') },
          400: { $ref: httpSchemaRef('ValidationErrorResponse') },
          404: { $ref: httpSchemaRef('CustomerNotFoundResponse') },
          500: { $ref: httpSchemaRef('InternalServerErrorResponse') },
        },
      },
    },
    controller.getById.bind(controller),
  );
}
