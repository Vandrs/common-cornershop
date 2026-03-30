import { z } from 'zod';

const numericQueryParam = (field: string) =>
  z.preprocess(
    (value) => {
      if (typeof value === 'number') return value;

      if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        return Number.isNaN(parsed) ? value : parsed;
      }

      return value;
    },
    z.number({ invalid_type_error: `${field} deve ser um número` }),
  );

export const paginationQueryBaseSchema = z.object({
  page: numericQueryParam('page')
    .pipe(z.number().int('page deve ser um número inteiro').min(1, 'page deve ser no mínimo 1'))
    .optional(),
  limit: numericQueryParam('limit')
    .pipe(
      z
        .number()
        .int('limit deve ser um número inteiro')
        .min(1, 'limit deve ser no mínimo 1')
        .max(100, 'limit deve ser no máximo 100'),
    )
    .optional(),
});

export const paginationQuerySchema = paginationQueryBaseSchema.transform((value) => ({
  page: value.page ?? 1,
  limit: value.limit ?? 10,
}));

export type PaginationQueryBaseSchema = z.infer<typeof paginationQueryBaseSchema>;

export type PaginationQuerySchema = z.infer<typeof paginationQuerySchema>;
