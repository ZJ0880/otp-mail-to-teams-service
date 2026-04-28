import { ApiProperty } from "@nestjs/swagger";

export class AdminLoginResponseDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Bearer token to authorize admin requests",
  })
  token!: string;

  @ApiProperty({
    example: "2026-04-27T16:20:00.000Z",
    description: "Token expiration timestamp in ISO 8601 format",
  })
  expiresAt!: string;

  @ApiProperty({
    example: "admin@otp.local",
    description: "Display name returned for the authenticated admin account",
  })
  displayName!: string;
  @ApiProperty({
    example: "ADMIN",
    description: "Role granted to the authenticated user",
  })
  role?: string;
}