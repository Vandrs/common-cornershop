import 'reflect-metadata';

import { Customer } from '../entities/customer.entity';
import { CustomerNotFoundException } from '../errors/customer-not-found.error';
import { ICustomerRepository } from '../repositories/customer.repository';
import { CreateCustomerDTO, CustomerService } from './customer.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let mockCustomerRepository: jest.Mocked<ICustomerRepository>;

  const makeCustomer = (overrides: Partial<Customer> = {}): Customer => {
    const customer = new Customer();
    customer.id = 'customer-1';
    customer.name = 'Maria Silva';
    customer.email = 'maria@cornershop.com';
    customer.phone = '11999999999';
    Object.assign(customer, overrides);
    return customer;
  };

  beforeEach(() => {
    mockCustomerRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    service = new CustomerService(mockCustomerRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildCustomer', () => {
    it('should build a customer with provided fields', () => {
      // Arrange
      const dto: CreateCustomerDTO = {
        name: 'João Santos',
        email: 'joao@cornershop.com',
        phone: '11988887777',
      };

      // Act
      const result = service.buildCustomer(dto);

      // Assert
      expect(result).toBeInstanceOf(Customer);
      expect(result.name).toBe(dto.name);
      expect(result.email).toBe(dto.email);
      expect(result.phone).toBe(dto.phone);
    });
  });

  describe('findOrFail', () => {
    it('should return customer when found', async () => {
      // Arrange
      const customer = makeCustomer();
      mockCustomerRepository.findById.mockResolvedValue(customer);

      // Act
      const result = await service.findOrFail('customer-1');

      // Assert
      expect(result).toBe(customer);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith('customer-1');
    });

    it('should throw CustomerNotFoundException when customer is not found', async () => {
      // Arrange
      mockCustomerRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOrFail('missing-id')).rejects.toThrow(CustomerNotFoundException);
      expect(mockCustomerRepository.findById).toHaveBeenCalledWith('missing-id');
    });
  });
});
