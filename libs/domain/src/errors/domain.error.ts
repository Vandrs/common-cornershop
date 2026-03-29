/**
 * Abstract base class for all domain-specific errors.
 *
 * Subclasses should provide a meaningful message and will automatically
 * have their `name` property set to the subclass constructor name, which
 * makes error identification in logs and error handlers straightforward.
 */
export abstract class DomainError extends Error {
  /**
   * Creates a new DomainError instance.
   * @param message - Human-readable description of the error (pt-BR for user-facing messages).
   */
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;

    // Maintains proper prototype chain for `instanceof` checks in transpiled ES5 targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
