import { DomainError } from './domain.error';

/**
 * Thrown when a requested product cannot be found in the data store.
 */
export class ProductNotFoundException extends DomainError {
  constructor() {
    super('Produto não encontrado');
  }
}
