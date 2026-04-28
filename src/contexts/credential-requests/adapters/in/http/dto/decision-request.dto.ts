import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class DecisionRequestDto {
  @ApiPropertyOptional({
    example: "Aprobado por cumplimiento de requisitos",
    description: "Optional decision note stored in audit logs",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}