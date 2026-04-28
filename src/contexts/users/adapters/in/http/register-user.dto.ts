import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterUserDto {
  @ApiProperty({ example: "Juan Carlos", description: "Given name(s) only, without surname" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Perez", description: "Last name of the user", required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: "12345678", description: "Document/ID number", required: false })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiProperty({ example: "juan.perez@example.com", description: "User email, must be unique" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "P@ssw0rd!", description: "Plain-text password (will be stored hashed)" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
