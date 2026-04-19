import { FastifyInstance } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';

import {
  categoryNotFoundResponseSchema,
  categoryParamsSchema,
  createCustomerBodySchema,
  createOrderBodySchema,
  createOrderResponseSchema,
  customerAlreadyExistsResponseSchema,
  customerNotFoundResponseSchema,
  customerParamsSchema,
  customerResponseSchema,
  getCategoryResponseSchema,
  getOrderResponseSchema,
  getOrderStatusResponseSchema,
  getProductResponseSchema,
  insufficientStockDetailedResponseSchema,
  insufficientStockResponseSchema,
  internalServerErrorResponseSchema,
  listCategoriesQuerySchema,
  listCategoriesResponseSchema,
  listOrdersQuerySchema,
  listOrdersResponseSchema,
  listProductsQuerySchema,
  listProductsResponseSchema,
  orderNotFoundResponseSchema,
  orderParamsSchema,
  productNotFoundResponseSchema,
  productNotFoundByIdResponseSchema,
  productParamsSchema,
  updateOrderStatusBodySchema,
  validationErrorResponseSchema,
} from '../http/schemas';

interface RegisteredZodSchema {
  id: string;
  schema: unknown;
}

const SCHEMA_REGISTRY: RegisteredZodSchema[] = [
  { id: 'CategoriesListQuery', schema: listCategoriesQuerySchema },
  { id: 'CategoriesParams', schema: categoryParamsSchema },
  { id: 'CategoriesListResponse', schema: listCategoriesResponseSchema },
  { id: 'CategoryResponse', schema: getCategoryResponseSchema },
  { id: 'CategoryNotFoundResponse', schema: categoryNotFoundResponseSchema },

  { id: 'ProductsListQuery', schema: listProductsQuerySchema },
  { id: 'ProductsParams', schema: productParamsSchema },
  { id: 'ProductsListResponse', schema: listProductsResponseSchema },
  { id: 'ProductResponse', schema: getProductResponseSchema },
  { id: 'ProductNotFoundResponse', schema: productNotFoundResponseSchema },
  { id: 'ProductNotFoundByIdResponse', schema: productNotFoundByIdResponseSchema },

  { id: 'CustomersCreateBody', schema: createCustomerBodySchema },
  { id: 'CustomersParams', schema: customerParamsSchema },
  { id: 'CustomerResponse', schema: customerResponseSchema },
  { id: 'CustomerNotFoundResponse', schema: customerNotFoundResponseSchema },
  { id: 'CustomerAlreadyExistsResponse', schema: customerAlreadyExistsResponseSchema },

  { id: 'OrdersCreateBody', schema: createOrderBodySchema },
  { id: 'OrdersParams', schema: orderParamsSchema },
  { id: 'OrdersListQuery', schema: listOrdersQuerySchema },
  { id: 'OrdersUpdateStatusBody', schema: updateOrderStatusBodySchema },
  { id: 'OrdersCreateResponse', schema: createOrderResponseSchema },
  { id: 'OrderResponse', schema: getOrderResponseSchema },
  { id: 'OrderStatusResponse', schema: getOrderStatusResponseSchema },
  { id: 'OrdersListResponse', schema: listOrdersResponseSchema },
  { id: 'OrderNotFoundResponse', schema: orderNotFoundResponseSchema },
  { id: 'InsufficientStockResponse', schema: insufficientStockResponseSchema },
  { id: 'InsufficientStockDetailedResponse', schema: insufficientStockDetailedResponseSchema },

  { id: 'ValidationErrorResponse', schema: validationErrorResponseSchema },
  { id: 'InternalServerErrorResponse', schema: internalServerErrorResponseSchema },
];

export type HttpSchemaId = (typeof SCHEMA_REGISTRY)[number]['id'];

export const httpSchemaRef = (id: HttpSchemaId): string => `${id}#`;

/**
 * Register all HTTP-level JSON Schemas in Fastify exactly once.
 */
export async function registerHttpSchemas(app: FastifyInstance): Promise<void> {
  for (const entry of SCHEMA_REGISTRY) {
    const converted = (zodToJsonSchema as (schema: unknown, options: unknown) => unknown)(
      entry.schema,
      {
        target: 'openApi3',
        name: entry.id,
      },
    ) as {
      definitions?: Record<string, unknown>;
    };

    const schema = converted.definitions?.[entry.id];

    if (!schema) {
      throw new Error(`Schema definition not generated for ${entry.id}`);
    }

    app.addSchema({
      ...(schema as object),
      $id: entry.id,
    });
  }
}
