import { DomainError } from './domain.error';

/**
 * Thrown when a requested customer cannot be found in the data store.
 */
export class CustomerNotFoundException extends DomainError {
  constructor() {
    super('Cliente não encontrado');
  }
}
