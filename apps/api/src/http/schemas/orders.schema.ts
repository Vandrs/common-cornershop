import { z } from 'zod';

import {
  domainErrorResponseSchema,
  idParamSchema,
  isoDateTimeSchema,
  moneySchema,
  orderStatusSchema,
  paginationMetaSchema,
  uuidSchema,
} from './shared/common.schema';
import { paginationQueryBaseSchema } from './shared/pagination.schema';

const orderProductSummarySchema = z.object({
  id: uuidSchema,
  name: z.string(),
});

const orderProductCreatedSummarySchema = orderProductSummarySchema.extend({
  price: moneySchema,
});

export const createOrderBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: uuidSchema,
        quantity: z.number().int().positive('quantity deve ser maior que 0'),
      }),
    )
    .min(1, 'items deve conter pelo menos 1 item')
    .max(50, 'items deve conter no máximo 50 itens'),
});

export type CreateOrderBodySchema = z.infer<typeof createOrderBodySchema>;

export const orderParamsSchema = idParamSchema;

export type OrderParamsSchema = z.infer<typeof orderParamsSchema>;

const orderItemBaseSchema = z.object({
  id: uuidSchema,
  productId: uuidSchema,
  quantity: z.number().int().positive(),
  unitPrice: moneySchema,
  subtotal: moneySchema,
});

const orderItemCreatedResponseSchema = orderItemBaseSchema.extend({
  product: orderProductCreatedSummarySchema,
});

const orderItemResponseSchema = orderItemBaseSchema.extend({
  product: orderProductSummarySchema,
});

export const createOrderResponseSchema = z.object({
  id: uuidSchema,
  orderNumber: z.string(),
  status: orderStatusSchema,
  totalAmount: moneySchema,
  items: z.array(orderItemCreatedResponseSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CreateOrderResponseSchema = z.infer<typeof createOrderResponseSchema>;

export const getOrderResponseSchema = z.object({
  id: uuidSchema,
  orderNumber: z.string(),
  status: orderStatusSchema,
  totalAmount: moneySchema,
  items: z.array(orderItemResponseSchema),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type GetOrderResponseSchema = z.infer<typeof getOrderResponseSchema>;

export const getOrderStatusResponseSchema = z.object({
  id: uuidSchema,
  orderNumber: z.string(),
  status: orderStatusSchema,
});

export type GetOrderStatusResponseSchema = z.infer<typeof getOrderStatusResponseSchema>;

export const listOrdersQuerySchema = paginationQueryBaseSchema
  .extend({
    status: orderStatusSchema.optional(),
    dateFrom: isoDateTimeSchema.optional(),
    dateTo: isoDateTimeSchema.optional(),
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    status: value.status,
    dateFrom: value.dateFrom,
    dateTo: value.dateTo,
  }));

export type ListOrdersQuerySchema = z.infer<typeof listOrdersQuerySchema>;

export const listOrderItemSchema = z.object({
  id: uuidSchema,
  orderNumber: z.string(),
  status: orderStatusSchema,
  totalAmount: moneySchema,
  itemsCount: z.number().int().nonnegative(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type ListOrderItemSchema = z.infer<typeof listOrderItemSchema>;

export const listOrdersResponseSchema = z.object({
  data: z.array(listOrderItemSchema),
  meta: paginationMetaSchema,
});

export type ListOrdersResponseSchema = z.infer<typeof listOrdersResponseSchema>;

export const orderNotFoundResponseSchema = domainErrorResponseSchema.extend({
  error: z.literal('OrderNotFoundException'),
  message: z.literal('Pedido não encontrado'),
});

export type OrderNotFoundResponseSchema = z.infer<typeof orderNotFoundResponseSchema>;

export const insufficientStockResponseSchema = domainErrorResponseSchema.extend({
  error: z.literal('InsufficientStockError'),
  message: z.literal('Estoque insuficiente'),
});

export const insufficientStockDetailedResponseSchema = z.object({
  error: z.string(),
  available: z.number().int().nonnegative(),
  requested: z.number().int().positive(),
});

export type InsufficientStockResponseSchema = z.infer<typeof insufficientStockResponseSchema>;

export type InsufficientStockDetailedResponseSchema = z.infer<
  typeof insufficientStockDetailedResponseSchema
>;
