import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class CreateCredentialRequestDto {
  @ApiProperty({
    example: "student@school.edu",
    description: "User email that must already exist",
  })
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "P@ssw0rd!",
    description: "Password for the existing user account",
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}