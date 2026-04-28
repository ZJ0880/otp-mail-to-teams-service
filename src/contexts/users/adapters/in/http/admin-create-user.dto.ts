import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AdminCreateUserDto {
  @ApiProperty({ example: "María Fernanda", description: "Given name(s) only, without surname" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Gómez", description: "Last name of the user", required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: "98765432", description: "Document/ID number", required: false })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ example: "maria.gomez@example.com", description: "Email for the new user" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongP@ss1", description: "Plain-text password (will be stored hashed)" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
