import { injectable, inject } from 'tsyringe';

import { Customer } from '../entities/customer.entity';
import { CustomerNotFoundException } from '../errors/customer-not-found.error';
import { ICustomerRepository } from '../repositories/customer.repository';

/**
 * DTO for creating a new customer.
 */
export interface CreateCustomerDTO {
  /** Full name of the customer. */
  name: string;
  /** Unique e-mail address. */
  email: string;
  /** Contact phone number. */
  phone: string;
}

/**
 * Service containing reusable business logic for Customer operations.
 */
@injectable()
export class CustomerService {
  constructor(
    @inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
  ) {}

  /**
   * Builds a new Customer entity from the supplied DTO.
   */
  buildCustomer(dto: CreateCustomerDTO): Customer {
    const customer = new Customer();
    customer.name = dto.name;
    customer.email = dto.email;
    customer.phone = dto.phone;
    return customer;
  }

  /**
   * Retrieves a customer by id and throws when it does not exist.
   */
  async findOrFail(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new CustomerNotFoundException();
    }

    return customer;
  }
}
