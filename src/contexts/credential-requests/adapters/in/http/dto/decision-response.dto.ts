import { ApiProperty } from "@nestjs/swagger";
import { RequestStatus } from "../../../../domain";

export class CredentialRequestDecisionResponseDto {
  @ApiProperty({
    example: "ckv3z4b2e0001abc123xyz",
    description: "Identifier of the request whose decision was executed",
  })
  requestId!: string;

  @ApiProperty({
    enum: ["APPROVED", "REJECTED"],
    example: "APPROVED",
    description: "Final decision applied to the request",
  })
  status!: Exclude<RequestStatus, "PENDING">;

  @ApiProperty({
    example: "2026-04-22T12:40:00.000Z",
    description: "Decision timestamp in ISO 8601 format",
  })
  decidedAtIso!: string;
}