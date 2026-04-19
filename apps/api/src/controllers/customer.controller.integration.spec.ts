import 'reflect-metadata';

import Fastify, { FastifyInstance } from 'fastify';

import { CustomerAlreadyExistsException, CustomerNotFoundException } from '@domain/index';

import { registerErrorHandler } from '../plugins/error-handler.plugin';

import { CustomerController } from './customer.controller';

describe('CustomerController (integration)', () => {
  let app: FastifyInstance;
  let createCustomerUseCase: { execute: jest.Mock };
  let getCustomerUseCase: { execute: jest.Mock };

  beforeEach(async () => {
    app = Fastify({ logger: false });
    registerErrorHandler(app);

    createCustomerUseCase = { execute: jest.fn() };
    getCustomerUseCase = { execute: jest.fn() };

    const controller = new CustomerController(
      createCustomerUseCase as never,
      getCustomerUseCase as never,
    );

    app.post('/api/customers', controller.create.bind(controller));
    app.get('/api/customers/:id', controller.getById.bind(controller));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('should create customer on POST /api/customers', async () => {
    createCustomerUseCase.execute.mockResolvedValue({
      id: 'f23e4567-e89b-12d3-a456-426614174111',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      createdAt: new Date('2026-04-18T10:00:00.000Z'),
      updatedAt: new Date('2026-04-18T10:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/customers',
      payload: {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(createCustomerUseCase.execute).toHaveBeenCalledWith({
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
    });
    expect(response.json()).toEqual({
      id: 'f23e4567-e89b-12d3-a456-426614174111',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
    });
  });

  it('should return ValidationError for invalid create payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/customers',
      payload: {
        name: 'A',
        email: 'not-an-email',
        phone: '',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual(
      expect.objectContaining({
        error: 'ValidationError',
        message: 'Dados inválidos',
      }),
    );
  });

  it('should return CustomerAlreadyExistsException envelope on duplicate customer', async () => {
    createCustomerUseCase.execute.mockRejectedValue(new CustomerAlreadyExistsException());

    const response = await app.inject({
      method: 'POST',
      url: '/api/customers',
      payload: {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      error: 'CustomerAlreadyExistsException',
      message: 'Cliente já cadastrado',
    });
  });

  it('should return customer on GET /api/customers/:id', async () => {
    getCustomerUseCase.execute.mockResolvedValue({
      id: 'f23e4567-e89b-12d3-a456-426614174111',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      createdAt: new Date('2026-04-18T10:00:00.000Z'),
      updatedAt: new Date('2026-04-18T10:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/api/customers/f23e4567-e89b-12d3-a456-426614174111',
    });

    expect(response.statusCode).toBe(200);
    expect(getCustomerUseCase.execute).toHaveBeenCalledWith('f23e4567-e89b-12d3-a456-426614174111');
    expect(response.json()).toEqual({
      id: 'f23e4567-e89b-12d3-a456-426614174111',
      name: 'João Silva',
      email: 'joao@email.com',
      phone: '11999999999',
      createdAt: '2026-04-18T10:00:00.000Z',
      updatedAt: '2026-04-18T10:00:00.000Z',
    });
  });

  it('should return CustomerNotFoundException envelope when customer does not exist', async () => {
    getCustomerUseCase.execute.mockRejectedValue(new CustomerNotFoundException());

    const response = await app.inject({
      method: 'GET',
      url: '/api/customers/f23e4567-e89b-12d3-a456-426614174111',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      error: 'CustomerNotFoundException',
      message: 'Cliente não encontrado',
    });
  });
});
