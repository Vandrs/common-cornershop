import 'reflect-metadata';

import { Customer } from '../../entities/customer.entity';
import { CustomerAlreadyExistsException } from '../../errors/customer-already-exists.error';
import { ICustomerRepository } from '../../repositories/customer.repository';
import { CreateCustomerDTO, CustomerService } from '../../services/customer.service';
import { CreateCustomerUseCase } from './create-customer.usecase';

describe('CreateCustomerUseCase', () => {
  let useCase: CreateCustomerUseCase;
  let mockCustomerRepository: jest.Mocked<ICustomerRepository>;
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
    mockCustomerRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    mockCustomerService = {
      buildCustomer: jest.fn(),
      findOrFail: jest.fn(),
    } as unknown as jest.Mocked<CustomerService>;

    useCase = new CreateCustomerUseCase(mockCustomerRepository, mockCustomerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create and return customer when email is unique', async () => {
      // Arrange
      const dto: CreateCustomerDTO = {
        name: 'Maria Silva',
        email: 'maria@cornershop.com',
        phone: '11999999999',
      };
      const builtCustomer = makeCustomer();
      const savedCustomer = makeCustomer();

      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerService.buildCustomer.mockReturnValue(builtCustomer);
      mockCustomerRepository.save.mockResolvedValue(savedCustomer);

      // Act
      const result = await useCase.execute(dto);

      // Assert
      expect(result).toBe(savedCustomer);
      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockCustomerService.buildCustomer).toHaveBeenCalledWith(dto);
      expect(mockCustomerRepository.save).toHaveBeenCalledWith(builtCustomer);
    });

    it('should normalize email before checking uniqueness and saving', async () => {
      // Arrange
      const dto: CreateCustomerDTO = {
        name: 'Maria Silva',
        email: '  Maria.Silva@CornerShop.com  ',
        phone: '11999999999',
      };
      const builtCustomer = makeCustomer({ email: 'maria.silva@cornershop.com' });

      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerService.buildCustomer.mockReturnValue(builtCustomer);
      mockCustomerRepository.save.mockResolvedValue(builtCustomer);

      // Act
      await useCase.execute(dto);

      // Assert
      expect(mockCustomerRepository.findByEmail).toHaveBeenCalledWith('maria.silva@cornershop.com');
      expect(mockCustomerService.buildCustomer).toHaveBeenCalledWith({
        ...dto,
        email: 'maria.silva@cornershop.com',
      });
    });

    it('should throw CustomerAlreadyExistsException when email already exists', async () => {
      // Arrange
      const dto: CreateCustomerDTO = {
        name: 'Maria Silva',
        email: 'maria@cornershop.com',
        phone: '11999999999',
      };
      mockCustomerRepository.findByEmail.mockResolvedValue(makeCustomer());

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow(CustomerAlreadyExistsException);
      expect(mockCustomerService.buildCustomer).not.toHaveBeenCalled();
      expect(mockCustomerRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate repository save errors', async () => {
      // Arrange
      const dto: CreateCustomerDTO = {
        name: 'Maria Silva',
        email: 'maria@cornershop.com',
        phone: '11999999999',
      };
      const builtCustomer = makeCustomer();
      const expectedError = new Error('DB write failed');

      mockCustomerRepository.findByEmail.mockResolvedValue(null);
      mockCustomerService.buildCustomer.mockReturnValue(builtCustomer);
      mockCustomerRepository.save.mockRejectedValue(expectedError);

      // Act & Assert
      await expect(useCase.execute(dto)).rejects.toThrow('DB write failed');
    });
  });
});
