import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RequestStatus } from "../../../../domain";

export class CredentialRequestContextDto {
  @ApiPropertyOptional({
    example: "Backend con Node",
    description: "Optional course or training context",
  })
  course?: string;

  @ApiPropertyOptional({
    example: "Necesito credenciales para pruebas",
    description: "Optional business or study reason for the request",
  })
  reason?: string;
}

export class CredentialRequestResponseDto {
  @ApiProperty({
    example: "ckv3z4b2e0001abc123xyz",
    description: "Unique identifier of the credential request",
  })
  id!: string;

  @ApiProperty({
    example: "student@school.edu",
    description: "Normalized requester email",
  })
  requesterEmail!: string;

  @ApiProperty({
    example: "udemy",
    description: "Default platform label for the generic credentials flow",
  })
  platform!: string;

  @ApiProperty({
    enum: ["PENDING", "APPROVED", "REJECTED"],
    example: "PENDING",
    description: "Current request status",
  })
  status!: RequestStatus;

  @ApiProperty({
    example: "2026-04-22T12:30:00.000Z",
    description: "Creation timestamp in ISO 8601 format",
  })
  createdAt!: string;

  @ApiPropertyOptional({
    example: "2026-04-22T12:40:00.000Z",
    description: "Decision timestamp in ISO 8601 format, when already resolved",
  })
  decidedAt?: string;

  @ApiPropertyOptional({
    type: CredentialRequestContextDto,
    description: "Optional course or reason metadata",
  })
  context?: CredentialRequestContextDto;
}

export class CredentialRequestListItemDto extends CredentialRequestResponseDto {}

export class CredentialRequestListResponseDto {
  @ApiProperty({
    example: 1,
    description: "Current page number",
  })
  page!: number;

  @ApiProperty({
    example: 20,
    description: "Requested page size",
  })
  pageSize!: number;

  @ApiProperty({
    example: 42,
    description: "Total number of items matching the current filters",
  })
  total!: number;

  @ApiProperty({
    example: 3,
    description: "Total number of pages available for the current page size",
  })
  totalPages!: number;

  @ApiProperty({ type: [CredentialRequestListItemDto] })
  items!: CredentialRequestListItemDto[];
}