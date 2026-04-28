import { CredentialRequestRepositoryPort } from "../ports/out/credential-request-repository.port";
import { Instant } from "../../domain";
import { ListCredentialRequestsInput, ListCredentialRequestsOutput, ListCredentialRequestsQuery } from "../use-cases/list-credential-requests.query";

export class ListCredentialRequestsService implements ListCredentialRequestsQuery {
  constructor(private readonly credentialRequestRepository: CredentialRequestRepositoryPort) {}

  async execute(input: ListCredentialRequestsInput): Promise<ListCredentialRequestsOutput> {
    const filters = {
      status: input.filters.status,
      from: input.filters.fromIso ? Instant.fromIso(input.filters.fromIso) : undefined,
      to: input.filters.toIso ? Instant.fromIso(input.filters.toIso) : undefined,
      emailContains: input.filters.emailContains,
      platform: input.filters.platform,
    };

    const result = await this.credentialRequestRepository.list(filters, input.pagination);
    return {
      total: result.total,
      items: result.items.map((request) => ({
        id: request.id.value,
        requesterEmail: request.requesterEmail.value,
        platform: request.platform.value,
        status: request.status,
        createdAt: request.createdAt.toIsoString(),
        decidedAt: request.decidedAt?.toIsoString(),
      })),
    };
  }
}