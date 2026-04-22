import { CredentialRequestId } from "../../domain";

export interface IdGeneratorPort {
  newCredentialRequestId(): CredentialRequestId;
}

