import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { GetCategoryUseCase, ListCategoriesUseCase } from '@domain/index';

import { categoryParamsSchema, listCategoriesQuerySchema } from '../http/schemas';

@injectable()
export class CategoryController {
  constructor(
    @inject('ListCategoriesUseCase')
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    @inject('GetCategoryUseCase')
    private readonly getCategoryUseCase: GetCategoryUseCase,
  ) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listCategoriesQuerySchema.parse(request.query);
    const result = await this.listCategoriesUseCase.execute(query);

    reply.status(200).send(result);
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = categoryParamsSchema.parse(request.params);
    const result = await this.getCategoryUseCase.execute(params.id);

    reply.status(200).send(result);
  }
}
