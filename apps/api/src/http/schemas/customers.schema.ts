import { z } from 'zod';

import {
  domainErrorResponseSchema,
  idParamSchema,
  isoDateTimeSchema,
  uuidSchema,
} from './shared/common.schema';

export const createCustomerBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'name deve ter no mínimo 2 caracteres')
      .max(100, 'name deve ter no máximo 100 caracteres'),
    email: z.string().trim().email('email deve ser um email válido').max(255),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/, 'phone deve estar no formato E.164'),
  })
  .strict();

export type CreateCustomerBodySchema = z.infer<typeof createCustomerBodySchema>;

export const customerParamsSchema = idParamSchema;

export type CustomerParamsSchema = z.infer<typeof customerParamsSchema>;

export const customerResponseSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type CustomerResponseSchema = z.infer<typeof customerResponseSchema>;

export const customerNotFoundResponseSchema = domainErrorResponseSchema.extend({
  error: z.literal('CustomerNotFoundException'),
  message: z.literal('Cliente não encontrado'),
});

export type CustomerNotFoundResponseSchema = z.infer<typeof customerNotFoundResponseSchema>;

export const customerAlreadyExistsResponseSchema = domainErrorResponseSchema.extend({
  error: z.literal('CustomerAlreadyExistsException'),
  message: z.literal('Cliente já cadastrado'),
});

export type CustomerAlreadyExistsResponseSchema = z.infer<
  typeof customerAlreadyExistsResponseSchema
>;
