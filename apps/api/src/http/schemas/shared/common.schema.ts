import { z } from 'zod';

import { OrderStatus } from '@domain/enums/order-status.enum';

export const uuidSchema = z.string().uuid('Deve ser um UUID válido');

export const isoDateTimeSchema = z.string().datetime({
  offset: true,
  message: 'Deve ser uma data ISO 8601 válida',
});

export const moneySchema = z.number().nonnegative();

export const idParamSchema = z.object({
  id: uuidSchema,
});

export type IdParamSchema = z.infer<typeof idParamSchema>;

export const validationErrorDetailSchema = z.object({
  field: z.string(),
  message: z.string(),
});

export const validationErrorResponseSchema = z.object({
  error: z.literal('ValidationError'),
  message: z.literal('Dados inválidos'),
  details: z.array(validationErrorDetailSchema).min(1),
});

export const domainErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
});

export const internalServerErrorResponseSchema = z.object({
  error: z.literal('InternalServerError'),
  message: z.literal('Erro interno do servidor'),
});

export const orderStatusSchema = z.nativeEnum(OrderStatus);

export type OrderStatusSchema = z.infer<typeof orderStatusSchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export type PaginationMetaSchema = z.infer<typeof paginationMetaSchema>;
