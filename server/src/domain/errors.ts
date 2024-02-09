/**
 * Domain-level errors. They carry an HTTP status so the transport layer can
 * translate them without knowing anything about the rules that produced them.
 */
export class DomainError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnknownModelError extends DomainError {
  constructor(model: string) {
    super(`No price list entry for model "${model}"`, 422, 'unknown_model');
  }
}

export class InvalidUsageError extends DomainError {
  constructor(message: string) {
    super(message, 400, 'invalid_usage');
  }
}

export class AuthError extends DomainError {
  constructor(message = 'Email or password is incorrect') {
    super(message, 401, 'unauthorized');
  }
}
