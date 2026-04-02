import { FastifyInstance } from 'fastify';
import { container } from 'tsyringe';

import {
  CancelOrderUseCase,
  CreateOrderUseCase,
  GetOrderUseCase,
  ListOrdersUseCase,
  UpdateOrderStatusUseCase,
} from '@domain/index';

import { OrderController } from '../controllers/order.controller';

/**
 * Registers all Orders HTTP routes.
 */
export async function registerOrderRoutes(app: FastifyInstance): Promise<void> {
  const controller = new OrderController(
    container.resolve(CreateOrderUseCase),
    container.resolve(GetOrderUseCase),
    container.resolve(ListOrdersUseCase),
    container.resolve(UpdateOrderStatusUseCase),
    container.resolve(CancelOrderUseCase),
  );

  app.post('/api/orders', {
    schema: {
      tags: ['Orders'],
      summary: 'Create order',
      operationId: 'createOrder',
      body: { $ref: 'OrdersCreateBody#' },
      response: {
        201: { $ref: 'OrdersCreateResponse#' },
        400: { $ref: 'InsufficientStockResponse#' },
        404: { $ref: 'ProductNotFoundResponse#' },
        500: { $ref: 'InternalServerErrorResponse#' },
      },
    },
    handler: controller.create.bind(controller),
  });

  app.get('/api/orders', {
    schema: {
      tags: ['Orders'],
      summary: 'List orders',
      operationId: 'listOrders',
      querystring: { $ref: 'OrdersListQuery#' },
      response: {
        200: { $ref: 'OrdersListResponse#' },
        400: { $ref: 'ValidationErrorResponse#' },
        500: { $ref: 'InternalServerErrorResponse#' },
      },
    },
    handler: controller.list.bind(controller),
  });

  app.get('/api/orders/:id', {
    schema: {
      tags: ['Orders'],
      summary: 'Get order by ID',
      operationId: 'getOrderById',
      params: { $ref: 'OrdersParams#' },
      response: {
        200: { $ref: 'OrderResponse#' },
        404: { $ref: 'OrderNotFoundResponse#' },
        500: { $ref: 'InternalServerErrorResponse#' },
      },
    },
    handler: controller.getById.bind(controller),
  });

  app.get('/api/orders/:id/status', {
    schema: {
      tags: ['Orders'],
      summary: 'Get order status',
      operationId: 'getOrderStatus',
      params: { $ref: 'OrdersParams#' },
      response: {
        200: { $ref: 'OrderStatusResponse#' },
        404: { $ref: 'OrderNotFoundResponse#' },
        500: { $ref: 'InternalServerErrorResponse#' },
      },
    },
    handler: controller.getStatus.bind(controller),
  });

  app.patch('/api/orders/:id/status', {
    schema: {
      tags: ['Orders'],
      summary: 'Update order status',
      operationId: 'updateOrderStatus',
      params: { $ref: 'OrdersParams#' },
      body: { $ref: 'OrdersUpdateStatusBody#' },
      response: {
        200: { $ref: 'OrderStatusResponse#' },
        400: { $ref: 'ValidationErrorResponse#' },
        404: { $ref: 'OrderNotFoundResponse#' },
        500: { $ref: 'InternalServerErrorResponse#' },
      },
    },
    handler: controller.updateStatus.bind(controller),
  });

  app.patch('/api/orders/:id/cancel', {
    schema: {
      tags: ['Orders'],
      summary: 'Cancel order',
      operationId: 'cancelOrder',
      params: { $ref: 'OrdersParams#' },
      response: {
        200: { $ref: 'OrderStatusResponse#' },
        404: { $ref: 'OrderNotFoundResponse#' },
        500: { $ref: 'InternalServerErrorResponse#' },
      },
    },
    handler: controller.cancel.bind(controller),
  });
}
