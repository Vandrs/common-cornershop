import Fastify from 'fastify';

import { registerHttpSchemas } from './http-schemas.plugin';

describe('registerHttpSchemas', () => {
  it('registers documented schema ids in Fastify', async () => {
    const app = Fastify({ logger: false });

    await registerHttpSchemas(app);

    const schemas = app.getSchemas();

    expect(schemas).toHaveProperty('CategoriesListQuery');
    expect(schemas).toHaveProperty('CategoriesParams');
    expect(schemas).toHaveProperty('CategoriesListResponse');

    expect(schemas).toHaveProperty('ProductsListQuery');
    expect(schemas).toHaveProperty('ProductsParams');
    expect(schemas).toHaveProperty('ProductsListResponse');
    expect(schemas).toHaveProperty('ProductResponse');

    expect(schemas).toHaveProperty('OrdersCreateBody');
    expect(schemas).toHaveProperty('OrdersParams');
    expect(schemas).toHaveProperty('OrdersListQuery');
    expect(schemas).toHaveProperty('OrdersCreateResponse');
    expect(schemas).toHaveProperty('OrderResponse');
    expect(schemas).toHaveProperty('OrderStatusResponse');
    expect(schemas).toHaveProperty('OrdersListResponse');

    expect(schemas).toHaveProperty('ValidationErrorResponse');
    expect(schemas).toHaveProperty('InternalServerErrorResponse');

    await app.close();
  });
});
