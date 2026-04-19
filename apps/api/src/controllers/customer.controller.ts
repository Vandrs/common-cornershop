import { FastifyReply, FastifyRequest } from 'fastify';
import { inject, injectable } from 'tsyringe';

import { CreateCustomerUseCase, Customer, GetCustomerUseCase } from '@domain/index';

import {
  createCustomerBodySchema,
  CreateCustomerBodySchema,
  customerParamsSchema,
  CustomerParamsSchema,
} from '../http/schemas';

type CustomerResponse = {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Controller responsible for customer HTTP endpoints.
 */
@injectable()
export class CustomerController {
  constructor(
    @inject('CreateCustomerUseCase')
    private readonly createCustomerUseCase: CreateCustomerUseCase,
    @inject('GetCustomerUseCase')
    private readonly getCustomerUseCase: GetCustomerUseCase,
  ) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = createCustomerBodySchema.parse(request.body) as CreateCustomerBodySchema;
    const customer = await this.createCustomerUseCase.execute(body);

    reply.status(201).send(this.toResponse(customer));
  }

  async getById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const params = customerParamsSchema.parse(request.params) as CustomerParamsSchema;
    const customer = await this.getCustomerUseCase.execute(params.id);

    reply.status(200).send(this.toResponse(customer));
  }

  private toResponse(customer: Customer): CustomerResponse {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
    };
  }
}
