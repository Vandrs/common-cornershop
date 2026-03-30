import { z } from 'zod';

import {
  domainErrorResponseSchema,
  idParamSchema,
  isoDateTimeSchema,
  moneySchema,
  paginationMetaSchema,
  uuidSchema,
} from './shared/common.schema';
import { paginationQueryBaseSchema } from './shared/pagination.schema';

const booleanQueryParamSchema = z.preprocess(
  (value) => {
    if (typeof value === 'boolean') return value;

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();

      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }

    return value;
  },
  z.boolean({ invalid_type_error: 'isActive deve ser booleano' }),
);

const categorySummarySchema = z.object({
  id: uuidSchema,
  name: z.string(),
});

const stockEmbeddedSchema = z.object({
  id: uuidSchema,
  productId: uuidSchema,
  quantity: z.number().int(),
  minimumQuantity: z.number().int(),
  lastUpdatedAt: isoDateTimeSchema,
});

export const listProductsQuerySchema = paginationQueryBaseSchema
  .extend({
    categoryId: uuidSchema.optional(),
    isActive: booleanQueryParamSchema.optional(),
  })
  .transform((value) => ({
    page: value.page ?? 1,
    limit: value.limit ?? 10,
    categoryId: value.categoryId,
    isActive: value.isActive,
  }));

export type ListProductsQuerySchema = z.infer<typeof listProductsQuerySchema>;

export const productParamsSchema = idParamSchema;

export type ProductParamsSchema = z.infer<typeof productParamsSchema>;

export const listProductItemSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  price: moneySchema,
  categoryId: uuidSchema,
  category: categorySummarySchema,
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type ListProductItemSchema = z.infer<typeof listProductItemSchema>;

export const listProductsResponseSchema = z.object({
  data: z.array(listProductItemSchema),
  meta: paginationMetaSchema,
});

export type ListProductsResponseSchema = z.infer<typeof listProductsResponseSchema>;

export const getProductResponseSchema = listProductItemSchema.extend({
  stock: stockEmbeddedSchema,
});

export type GetProductResponseSchema = z.infer<typeof getProductResponseSchema>;

export const productNotFoundResponseSchema = domainErrorResponseSchema.extend({
  error: z.literal('ProductNotFoundException'),
  message: z.literal('Produto não encontrado'),
});

export const productNotFoundByIdResponseSchema = productNotFoundResponseSchema.extend({
  productId: uuidSchema,
});

export type ProductNotFoundResponseSchema = z.infer<typeof productNotFoundResponseSchema>;

export type ProductNotFoundByIdResponseSchema = z.infer<typeof productNotFoundByIdResponseSchema>;
