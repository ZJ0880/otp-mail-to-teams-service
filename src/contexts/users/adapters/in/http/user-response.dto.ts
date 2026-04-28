import { ApiProperty } from "@nestjs/swagger";

export class UserResponseDto {
  @ApiProperty({ example: "ckxyz123abc", description: "User id" })
  id!: string;

  @ApiProperty({ example: "Juan Carlos", description: "Given name(s) only, without surname" })
  name!: string;

  @ApiProperty({ example: "Perez", description: "Last name", required: false })
  lastName?: string;

  @ApiProperty({ example: "12345678", description: "Document/ID number", required: false })
  document?: string;

  @ApiProperty({ example: "juan.perez@example.com", description: "Email" })
  email!: string;

  @ApiProperty({ example: "USER", description: "Role of the user (USER | ADMIN)" })
  role!: string;

  @ApiProperty({ example: true, description: "Is the user active" })
  isActive!: boolean;

  @ApiProperty({ example: "2026-04-27T16:20:00.000Z", description: "Creation timestamp in ISO 8601 format" })
  createdAt!: string;
}
