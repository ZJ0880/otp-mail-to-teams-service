import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AdminLoginDto {
  @ApiProperty({
    example: "admin@otp.local",
    description: "Administrative username used to obtain a JWT session",
  })
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail()
  username!: string;

  @ApiProperty({
    example: "change-me-now",
    description: "Password for the configured admin account",
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

