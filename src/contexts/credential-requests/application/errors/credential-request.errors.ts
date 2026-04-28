export class CredentialRequestNotFoundError extends Error {
  constructor(message = "Credential request not found") {
    super(message);
    this.name = "CredentialRequestNotFoundError";
  }
}

export class CredentialRequestConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CredentialRequestConflictError";
  }
}
