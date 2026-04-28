import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CredentialRequestId } from "../../../domain";
import { AdminAuthGuard } from "../../../../admin-auth/infrastructure/nest/admin-auth.guard";
import { ApproveCredentialRequestService } from "../../../application/services/approve-credential-request.service";
import { GetCredentialRequestByIdService } from "../../../application/services/get-credential-request-by-id.service";
import { ListCredentialRequestsService } from "../../../application/services/list-credential-requests.service";
import { RejectCredentialRequestService } from "../../../application/services/reject-credential-request.service";
import { DecisionRequestDto } from "./dto/decision-request.dto";
import { CredentialRequestListResponseDto, CredentialRequestResponseDto } from "./dto/credential-request-response.dto";
import { ListCredentialRequestsQueryDto } from "./dto/list-credential-requests-query.dto";
import { mapCredentialRequestError } from "./credential-request-error.mapper";

@ApiTags("Admin Credential Requests")
@ApiBearerAuth("bearer")
@UseGuards(AdminAuthGuard)
@Controller("admin/credential-requests")
export class AdminCredentialRequestsController {
  constructor(
    private readonly listCredentialRequestsService: ListCredentialRequestsService,
    private readonly getCredentialRequestByIdService: GetCredentialRequestByIdService,
    private readonly approveCredentialRequestService: ApproveCredentialRequestService,
    private readonly rejectCredentialRequestService: RejectCredentialRequestService,
  ) {}

  @Get()
  @ApiOperation({ summary: "List admin credential requests" })
  @ApiOkResponse({
    type: CredentialRequestListResponseDto,
    description: "Paginated credential requests matching the provided filters",
  })
  async list(@Query() query: ListCredentialRequestsQueryDto): Promise<CredentialRequestListResponseDto> {
    try {
      const result = await this.listCredentialRequestsService.execute({
        filters: {
          status: query.status,
          fromIso: query.fromIso,
          toIso: query.toIso,
          emailContains: query.emailContains,
          platform: query.platform,
        },
        pagination: {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
        },
      });

      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const totalPages = result.total === 0 ? 0 : Math.ceil(result.total / pageSize);

      return {
        page,
        pageSize,
        total: result.total,
        totalPages,
        items: result.items.map((item) => ({
          id: item.id,
          requesterEmail: item.requesterEmail,
          platform: item.platform,
          status: item.status,
          createdAt: item.createdAt,
          decidedAt: item.decidedAt,
        })),
      };
    } catch (error: unknown) {
      mapCredentialRequestError(error);
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an admin credential request by id" })
  @ApiParam({
    name: "id",
    example: "ckv3z4b2e0001abc123xyz",
    description: "Credential request identifier",
  })
  @ApiOkResponse({ type: CredentialRequestResponseDto, description: "Credential request details" })
  async getById(@Param("id") id: string): Promise<CredentialRequestResponseDto> {
    try {
      const result = await this.getCredentialRequestByIdService.execute({
        requestId: CredentialRequestId.from(id),
      });

      return this.toResponseFromAggregate(result.request);
    } catch (error: unknown) {
      mapCredentialRequestError(error);
    }
  }

  @Post(":id/approve")
  @ApiOperation({ summary: "Approve a credential request" })
  @ApiParam({
    name: "id",
    example: "ckv3z4b2e0001abc123xyz",
    description: "Credential request identifier",
  })
  @ApiBody({ type: DecisionRequestDto })
  @ApiCreatedResponse({ type: CredentialRequestResponseDto, description: "Credential request approved" })
  async approve(@Param("id") id: string, @Body() dto: DecisionRequestDto): Promise<CredentialRequestResponseDto> {
    try {
      const result = await this.approveCredentialRequestService.execute({
        requestId: CredentialRequestId.from(id),
        reason: dto.reason,
      });

      const request = await this.getCredentialRequestByIdService.execute({
        requestId: CredentialRequestId.from(id),
      });

      return this.toResponseFromAggregate(request.request, result.decidedAt?.toIsoString());
    } catch (error: unknown) {
      mapCredentialRequestError(error);
    }
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject a credential request" })
  @ApiParam({
    name: "id",
    example: "ckv3z4b2e0001abc123xyz",
    description: "Credential request identifier",
  })
  @ApiBody({ type: DecisionRequestDto })
  @ApiCreatedResponse({ type: CredentialRequestResponseDto, description: "Credential request rejected" })
  async reject(@Param("id") id: string, @Body() dto: DecisionRequestDto): Promise<CredentialRequestResponseDto> {
    try {
      const result = await this.rejectCredentialRequestService.execute({
        requestId: CredentialRequestId.from(id),
        reason: dto.reason,
      });

      const request = await this.getCredentialRequestByIdService.execute({
        requestId: CredentialRequestId.from(id),
      });

      return this.toResponseFromAggregate(request.request, result.decidedAt.toIsoString());
    } catch (error: unknown) {
      mapCredentialRequestError(error);
    }
  }

  private toResponseFromAggregate(
    request: { id: { value: string }; requesterEmail: { value: string }; platform: { value: string }; context: { course?: { value: string }; reason?: { value: string } }; status: string; createdAt: { toIsoString(): string }; decidedAt?: { toIsoString(): string } },
    decidedAtIso?: string,
  ): CredentialRequestResponseDto {
    return {
      id: request.id.value,
      requesterEmail: request.requesterEmail.value,
      platform: request.platform.value,
      status: request.status as CredentialRequestResponseDto["status"],
      createdAt: request.createdAt.toIsoString(),
      decidedAt: decidedAtIso ?? request.decidedAt?.toIsoString(),
      context:
        request.context.course || request.context.reason
          ? {
              course: request.context.course?.value,
              reason: request.context.reason?.value,
            }
          : undefined,
    };
  }
}