import { Transform } from "class-transformer";
import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "admin@otp.local" })
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail()
  username!: string;

  @ApiProperty({ example: "change-me-now" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterUserDto {
  @ApiProperty({ example: "operator@otp.local" })
  @Transform(({ value }) => String(value ?? "").trim().toLowerCase())
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Operator OTP" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "change-me-now" })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: "OPERATOR", enum: ["ADMIN", "OPERATOR", "VIEWER"] })
  @IsIn(["ADMIN", "OPERATOR", "VIEWER"])
  role!: UserRole;
}

export class UpdateUserRoleDto {
  @ApiProperty({ example: "OPERATOR", enum: ["ADMIN", "OPERATOR", "VIEWER"] })
  @Transform(({ value }) => String(value ?? "").trim().toUpperCase())
  @IsIn(["ADMIN", "OPERATOR", "VIEWER"])
  role!: UserRole;
}

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokenPayload {
  token: string;
  expiresAt: string;
  role: string;
  displayName: string;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
  role: UserRole;
}

export interface AuthSessionPayload {
  userId: string;
  username: string;
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  username: string;
  role: UserRole;
  iss?: string;
  aud?: string;
}

export type UserRole = "ADMIN" | "OPERATOR" | "VIEWER";


