import { injectable, inject } from 'tsyringe';

import { Customer } from '../../entities/customer.entity';
import { CustomerService } from '../../services/customer.service';

/**
 * Use case responsible for retrieving a customer by id.
 */
@injectable()
export class GetCustomerUseCase {
  constructor(
    @inject('CustomerService')
    private readonly customerService: CustomerService,
  ) {}

  /**
   * Returns a customer or throws when it does not exist.
   */
  async execute(id: string): Promise<Customer> {
    return this.customerService.findOrFail(id);
  }
}
