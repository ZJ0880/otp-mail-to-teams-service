import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiBody, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { CredentialRequestId } from "../../../domain";
import { CreateCredentialRequestService } from "../../../application/services/create-credential-request.service";
import { GetCredentialRequestByIdService } from "../../../application/services/get-credential-request-by-id.service";
import { CreateCredentialRequestDto } from "./dto/create-credential-request.dto";
import { CredentialRequestResponseDto } from "./dto/credential-request-response.dto";
import { mapCredentialRequestError } from "./credential-request-error.mapper";

@ApiTags("Public Credential Requests")
@Controller("public/credential-requests")
export class PublicCredentialRequestsController {
  constructor(
    private readonly createCredentialRequestService: CreateCredentialRequestService,
    private readonly getCredentialRequestByIdService: GetCredentialRequestByIdService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a public credential request" })
  @ApiBody({
    type: CreateCredentialRequestDto,
    schema: {
      example: {
        email: "student@school.edu",
        password: "P@ssw0rd!",
      },
    },
  })
  @ApiCreatedResponse({
    type: CredentialRequestResponseDto,
    description: "Credential request created",
    schema: {
      example: {
        id: "ckv3z4b2e0001abc123xyz",
        requesterEmail: "student@school.edu",
        platform: "udemy",
        status: "PENDING",
        createdAt: "2026-04-27T22:30:00.000Z",
      },
    },
  })
  async create(@Body() dto: CreateCredentialRequestDto): Promise<CredentialRequestResponseDto> {
    try {
      const result = await this.createCredentialRequestService.execute(dto);
      return {
        id: result.requestId.value,
        requesterEmail: dto.email,
        platform: "udemy",
        status: result.status,
        createdAt: result.createdAt.toIsoString(),
      };
    } catch (error: unknown) {
      mapCredentialRequestError(error);
    }
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a public credential request by id" })
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

      return this.toResponse(result.request);
    } catch (error: unknown) {
      mapCredentialRequestError(error);
    }
  }

  private toResponse(request: {
    id: { value: string };
    requesterEmail: { value: string };
    platform: { value: string };
    context: { course?: { value: string }; reason?: { value: string } };
    status: string;
    createdAt: { toIsoString(): string };
    decidedAt?: { toIsoString(): string };
  }): CredentialRequestResponseDto {
    return {
      id: request.id.value,
      requesterEmail: request.requesterEmail.value,
      platform: request.platform.value,
      status: request.status as CredentialRequestResponseDto["status"],
      createdAt: request.createdAt.toIsoString(),
      decidedAt: request.decidedAt?.toIsoString(),
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