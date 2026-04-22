import type { UseCase } from "../contracts/use-case";
import type { CredentialRequest, CredentialRequestId } from "../../domain";

export interface GetCredentialRequestByIdInput {
  requestId: CredentialRequestId;
}

export interface GetCredentialRequestByIdOutput {
  request: CredentialRequest;
}

export interface GetCredentialRequestByIdQuery
  extends UseCase<GetCredentialRequestByIdInput, GetCredentialRequestByIdOutput> {}

