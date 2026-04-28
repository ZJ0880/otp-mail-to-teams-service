import { CredentialRequestRepositoryPort } from "../ports/out/credential-request-repository.port";
import { GetCredentialRequestByIdInput, GetCredentialRequestByIdOutput, GetCredentialRequestByIdQuery } from "../use-cases/get-credential-request-by-id.query";
import { CredentialRequestNotFoundError } from "../errors/credential-request.errors";

export class GetCredentialRequestByIdService implements GetCredentialRequestByIdQuery {
  constructor(private readonly credentialRequestRepository: CredentialRequestRepositoryPort) {}

  async execute(input: GetCredentialRequestByIdInput): Promise<GetCredentialRequestByIdOutput> {
    const request = await this.credentialRequestRepository.getById(input.requestId);
    if (!request) {
      throw new CredentialRequestNotFoundError();
    }

    return { request };
  }
}