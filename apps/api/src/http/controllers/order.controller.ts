import { FastifyReply, FastifyRequest } from 'fastify';

import {
  CancelOrderUseCase,
  CreateOrderUseCase,
  GetOrderUseCase,
  ListOrdersUseCase,
  Order,
  OrderItem,
  OrderListParams,
  OrderStatus,
  UpdateOrderStatusUseCase,
} from '@domain/index';
import { PaginatedResult } from '@shared/types/pagination.types';

import {
  CreateOrderBodySchema,
  ListOrdersQuerySchema,
  OrderParamsSchema,
  UpdateOrderStatusBodySchema,
  createOrderBodySchema,
  listOrdersQuerySchema,
  orderParamsSchema,
  updateOrderStatusBodySchema,
} from '../schemas';

type OrderListItemResponse = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
};

type OrderItemResponse = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: {
    id: string;
    name: string;
  };
};

type OrderItemCreatedResponse = OrderItemResponse & {
  product: {
    id: string;
    name: string;
    price: number;
  };
};

type OrderDetailsResponse = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemResponse[];
  createdAt: string;
  updatedAt: string;
};

type OrderCreatedResponse = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItemCreatedResponse[];
  createdAt: string;
  updatedAt: string;
};

/**
 * HTTP controller for Orders endpoints.
 */
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderUseCase: GetOrderUseCase,
    private readonly listOrdersUseCase: ListOrdersUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createOrderBodySchema.parse(request.body) as CreateOrderBodySchema;

    const order = await this.createOrderUseCase.execute({
      items: body.items,
    });

    reply.status(201).send(this.toCreateResponse(order));
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = orderParamsSchema.parse(request.params) as OrderParamsSchema;
    const order = await this.getOrderUseCase.execute(params.id);

    reply.status(200).send(this.toDetailsResponse(order));
  }

  async getStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = orderParamsSchema.parse(request.params) as OrderParamsSchema;
    const order = await this.getOrderUseCase.execute(params.id);

    reply.status(200).send({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listOrdersQuerySchema.parse(request.query) as ListOrdersQuerySchema;
    const result = await this.listOrdersUseCase.execute(this.toOrderListParams(query));

    reply.status(200).send(this.toListResponse(result));
  }

  async updateStatus(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = orderParamsSchema.parse(request.params) as OrderParamsSchema;
    const body = updateOrderStatusBodySchema.parse(request.body) as UpdateOrderStatusBodySchema;

    const order = await this.updateOrderStatusUseCase.execute({
      id: params.id,
      status: body.status,
    });

    reply.status(200).send({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });
  }

  async cancel(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = orderParamsSchema.parse(request.params) as OrderParamsSchema;
    const order = await this.cancelOrderUseCase.execute(params.id);

    reply.status(200).send({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    });
  }

  private toOrderListParams(query: ListOrdersQuerySchema): OrderListParams {
    return {
      page: query.page,
      limit: query.limit,
      status: query.status,
      createdAfter: query.dateFrom ? new Date(query.dateFrom as string) : undefined,
      createdBefore: query.dateTo ? new Date(query.dateTo as string) : undefined,
    };
  }

  private toListResponse(result: PaginatedResult<Order>): {
    data: OrderListItemResponse[];
    meta: PaginatedResult<Order>['meta'];
  } {
    return {
      data: result.data.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        totalAmount: Number(order.totalAmount),
        itemsCount: this.getItemsCount(order),
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
      })),
      meta: result.meta,
    };
  }

  private toCreateResponse(order: Order): OrderCreatedResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      items: (order.items ?? []).map((item) => this.toCreateItemResponse(item)),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private toDetailsResponse(order: Order): OrderDetailsResponse {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      items: (order.items ?? []).map((item) => this.toItemResponse(item)),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }

  private toItemResponse(item: OrderItem): OrderItemResponse {
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
      product: {
        id: item.product.id,
        name: item.product.name,
      },
    };
  }

  private toCreateItemResponse(item: OrderItem): OrderItemCreatedResponse {
    return {
      ...this.toItemResponse(item),
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
      },
    };
  }

  private getItemsCount(order: Order): number {
    const orderWithItemsCount = order as Order & { itemsCount?: number };

    return orderWithItemsCount.itemsCount ?? order.items?.length ?? 0;
  }
}
