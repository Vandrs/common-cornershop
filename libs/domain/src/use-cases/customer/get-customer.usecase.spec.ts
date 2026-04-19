import 'reflect-metadata';

import { Customer } from '../../entities/customer.entity';
import { CustomerNotFoundException } from '../../errors/customer-not-found.error';
import { CustomerService } from '../../services/customer.service';
import { GetCustomerUseCase } from './get-customer.usecase';

describe('GetCustomerUseCase', () => {
  let useCase: GetCustomerUseCase;
  let mockCustomerService: jest.Mocked<CustomerService>;

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
    mockCustomerService = {
      buildCustomer: jest.fn(),
      findOrFail: jest.fn(),
    } as unknown as jest.Mocked<CustomerService>;

    useCase = new GetCustomerUseCase(mockCustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return customer when found', async () => {
      // Arrange
      const customer = makeCustomer();
      mockCustomerService.findOrFail.mockResolvedValue(customer);

      // Act
      const result = await useCase.execute('customer-1');

      // Assert
      expect(result).toBe(customer);
      expect(mockCustomerService.findOrFail).toHaveBeenCalledWith('customer-1');
    });

    it('should throw CustomerNotFoundException when customer does not exist', async () => {
      // Arrange
      mockCustomerService.findOrFail.mockRejectedValue(new CustomerNotFoundException());

      // Act & Assert
      await expect(useCase.execute('missing-id')).rejects.toThrow(CustomerNotFoundException);
      expect(mockCustomerService.findOrFail).toHaveBeenCalledWith('missing-id');
    });
  });
});
