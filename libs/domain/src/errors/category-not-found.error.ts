import { DomainError } from './domain.error';

/**
 * Thrown when a requested category cannot be found in the data store.
 */
export class CategoryNotFoundException extends DomainError {
  constructor() {
    super('Categoria não encontrada');
  }
}
