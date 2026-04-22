import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class AdminLoginDto {
  @ApiProperty({ example: "admin@otp.local" })
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail()
  username!: string;

  @ApiProperty({ example: "change-me-now" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

