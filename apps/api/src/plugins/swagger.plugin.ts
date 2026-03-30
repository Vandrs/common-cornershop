import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

/**
 * Registers OpenAPI generators and Swagger UI.
 */
export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Common Cornershop API',
        description: 'API REST para gestão de lojas de esquina',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:3000', description: 'Local' }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });
}
