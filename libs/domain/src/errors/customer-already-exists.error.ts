import { DomainError } from './domain.error';

/**
 * Thrown when trying to create a customer with an email already in use.
 */
export class CustomerAlreadyExistsException extends DomainError {
  constructor() {
    super('Cliente já cadastrado');
  }
}
