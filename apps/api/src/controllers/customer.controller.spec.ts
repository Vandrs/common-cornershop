import { FastifyReply } from 'fastify';

import { Customer } from '@domain/index';

import { CustomerController } from './customer.controller';

const makeCustomer = (): Customer => {
  const customer = new Customer();
  customer.id = 'f23e4567-e89b-12d3-a456-426614174111';
  customer.name = 'João Silva';
  customer.email = 'joao@email.com';
  customer.phone = '11999999999';
  customer.createdAt = new Date('2026-04-18T10:00:00.000Z');
  customer.updatedAt = new Date('2026-04-18T10:00:00.000Z');
  return customer;
};

describe('CustomerController', () => {
  let createCustomerUseCase: { execute: jest.Mock };
  let getCustomerUseCase: { execute: jest.Mock };
  let controller: CustomerController;

  beforeEach(() => {
    createCustomerUseCase = { execute: jest.fn() };
    getCustomerUseCase = { execute: jest.fn() };
    controller = new CustomerController(
      createCustomerUseCase as never,
      getCustomerUseCase as never,
    );
  });

  it('should create customer and return 201 response', async () => {
    const customer = makeCustomer();
    createCustomerUseCase.execute.mockResolvedValue(customer);

    const request = {
      body: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    } as unknown;

    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const reply = { status } as unknown as FastifyReply;

    await controller.create(request as never, reply);

    expect(createCustomerUseCase.execute).toHaveBeenCalledWith({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: customer.id,
        email: customer.email,
      }),
    );
  });

  it('should return customer on getById and 200 response', async () => {
    const customer = makeCustomer();
    getCustomerUseCase.execute.mockResolvedValue(customer);

    const request = {
      params: { id: customer.id },
    } as unknown;

    const send = jest.fn();
    const status = jest.fn().mockReturnValue({ send });
    const reply = { status } as unknown as FastifyReply;

    await controller.getById(request as never, reply);

    expect(getCustomerUseCase.execute).toHaveBeenCalledWith(customer.id);
    expect(status).toHaveBeenCalledWith(200);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        id: customer.id,
        email: customer.email,
      }),
    );
  });
});
