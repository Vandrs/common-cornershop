import { DomainError } from './domain.error';

/**
 * Thrown when a requested order cannot be found in the data store.
 */
export class OrderNotFoundException extends DomainError {
  constructor() {
    super('Pedido não encontrado');
  }
}
