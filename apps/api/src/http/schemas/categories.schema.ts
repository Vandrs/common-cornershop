import { z } from 'zod';

import {
  domainErrorResponseSchema,
  idParamSchema,
  isoDateTimeSchema,
  paginationMetaSchema,
} from './shared/common.schema';
import { paginationQuerySchema } from './shared/pagination.schema';

export const listCategoriesQuerySchema = paginationQuerySchema;

export type ListCategoriesQuerySchema = z.infer<typeof listCategoriesQuerySchema>;

export const categoryParamsSchema = idParamSchema;

export type CategoryParamsSchema = z.infer<typeof categoryParamsSchema>;

export const categoryResponseItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CategoryResponseItemSchema = z.infer<typeof categoryResponseItemSchema>;

export const listCategoriesResponseSchema = z.object({
  data: z.array(categoryResponseItemSchema),
  meta: paginationMetaSchema,
});

export type ListCategoriesResponseSchema = z.infer<typeof listCategoriesResponseSchema>;

export const getCategoryResponseSchema = categoryResponseItemSchema;

export type GetCategoryResponseSchema = z.infer<typeof getCategoryResponseSchema>;

export const categoryNotFoundResponseSchema = domainErrorResponseSchema.extend({
  error: z.literal('CategoryNotFoundException'),
  message: z.literal('Categoria não encontrada'),
});

export type CategoryNotFoundResponseSchema = z.infer<typeof categoryNotFoundResponseSchema>;
