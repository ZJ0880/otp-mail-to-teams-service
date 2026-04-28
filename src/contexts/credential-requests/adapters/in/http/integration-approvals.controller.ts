import { Controller, Param, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { ExecuteApprovalTokenDecisionService } from "../../../application/services/execute-approval-token-decision.service";
import { CredentialRequestDecisionResponseDto } from "./dto/decision-response.dto";
import { mapCredentialRequestError } from "./credential-request-error.mapper";

@ApiTags("Approval Integrations")
@Controller("integrations/approvals")
export class IntegrationApprovalsController {
  constructor(private readonly executeApprovalTokenDecisionService: ExecuteApprovalTokenDecisionService) {}

  @Post(":token/execute")
  @ApiOperation({ summary: "Execute approval token decision" })
  @ApiParam({
    name: "token",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Signed approval token",
  })
  @ApiCreatedResponse({ type: CredentialRequestDecisionResponseDto, description: "Approval token executed" })
  async execute(@Param("token") token: string): Promise<CredentialRequestDecisionResponseDto> {
    try {
      const result = await this.executeApprovalTokenDecisionService.execute({ token });

      return {
        requestId: result.requestId.value,
        status: result.status,
        decidedAtIso: result.decidedAt.toIsoString(),
      };
    } catch (error: unknown) {
      mapCredentialRequestError(error);
    }
  }
}