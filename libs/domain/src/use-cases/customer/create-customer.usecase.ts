import { injectable, inject } from 'tsyringe';

import { Customer } from '../../entities/customer.entity';
import { CustomerAlreadyExistsException } from '../../errors/customer-already-exists.error';
import { ICustomerRepository } from '../../repositories/customer.repository';
import { CreateCustomerDTO, CustomerService } from '../../services/customer.service';

/**
 * Use case responsible for creating a new customer.
 */
@injectable()
export class CreateCustomerUseCase {
  constructor(
    @inject('ICustomerRepository')
    private readonly customerRepository: ICustomerRepository,
    @inject('CustomerService')
    private readonly customerService: CustomerService,
  ) {}

  /**
   * Creates a customer after enforcing unique email.
   */
  async execute(dto: CreateCustomerDTO): Promise<Customer> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedDto: CreateCustomerDTO = {
      ...dto,
      email: normalizedEmail,
    };

    const existing = await this.customerRepository.findByEmail(normalizedEmail);

    if (existing) {
      throw new CustomerAlreadyExistsException();
    }

    const customer = this.customerService.buildCustomer(normalizedDto);
    return this.customerRepository.save(customer);
  }
}
