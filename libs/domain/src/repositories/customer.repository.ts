import { Customer } from '../entities/customer.entity';

/**
 * Repository contract for Customer operations.
 */
export interface ICustomerRepository {
  /**
   * Retrieves a customer by its unique identifier.
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * Retrieves a customer by its unique email address.
   */
  findByEmail(email: string): Promise<Customer | null>;

  /**
   * Persists the provided customer.
   */
  save(customer: Customer): Promise<Customer>;

  /**
   * Soft-deletes a customer by its identifier.
   */
  softDelete(id: string): Promise<void>;
}
