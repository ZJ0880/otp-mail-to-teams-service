import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  CredentialRequestConflictError,
  CredentialRequestNotFoundError,
} from "../../../application/errors/credential-request.errors";

export function mapCredentialRequestError(error: unknown): never {
  if (error instanceof CredentialRequestNotFoundError) {
    throw new NotFoundException(error.message);
  }

  if (error instanceof CredentialRequestConflictError) {
    throw new ConflictException(error.message);
  }

  if (error instanceof UnauthorizedException) {
    throw error;
  }

  if (error instanceof Error) {
    throw new BadRequestException(error.message);
  }

  throw new InternalServerErrorException("Unexpected credential request error");
}
