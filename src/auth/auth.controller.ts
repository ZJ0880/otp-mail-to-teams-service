import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  AuthSessionPayload,
  AuthTokenPayload,
  LoginDto,
  RegisterUserDto,
  UpdateUserRoleDto,
  UserSummary,
} from "./auth.types";
import { TokenAuthGuard } from "./token-auth.guard";
import { Roles } from "./roles.decorator";
import { RolesGuard } from "./roles.guard";

interface RequestWithUser {
  user: {
    userId: string;
    username: string;
    role: "ADMIN" | "OPERATOR" | "VIEWER";
  };
}

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Authenticate user and issue JWT token" })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: "Successful login",
    schema: {
      example: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        expiresAt: "2026-04-19T22:18:42.000Z",
        role: "ADMIN",
        displayName: "Admin OTP",
      },
    },
  })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  login(@Body() input: LoginDto): Promise<AuthTokenPayload> {
    return this.authService.login(input);
  }

  @Get("me")
  @UseGuards(TokenAuthGuard)
  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "Get current authenticated user session" })
  @ApiOkResponse({
    description: "Current user session",
    schema: {
      example: {
        userId: "clx123abc",
        username: "admin@otp.local",
        role: "ADMIN",
      },
    },
  })
  me(@Req() request: RequestWithUser): AuthSessionPayload {
    return {
      userId: request.user.userId,
      username: request.user.username,
      role: request.user.role,
    };
  }

  @Get("users")
  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "List users (admin only)" })
  @ApiOkResponse({ description: "Users list" })
  listUsers(@Req() request: RequestWithUser): Promise<UserSummary[]> {
    return this.authService.listUsers(request.user);
  }

  @Post("register")
  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "Create user account (admin only)" })
  @ApiBody({ type: RegisterUserDto })
  @ApiOkResponse({ description: "User created successfully" })
  register(
    @Req() request: RequestWithUser,
    @Body() input: RegisterUserDto,
  ): Promise<UserSummary> {
    return this.authService.registerUser(request.user, input);
  }

  @Patch("users/:userId/role")
  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "Update user role (admin only)" })
  @ApiParam({ name: "userId", example: "clx123abc" })
  @ApiBody({ type: UpdateUserRoleDto })
  @ApiOkResponse({ description: "Updated user", type: Object })
  @ApiBadRequestResponse({ description: "Invalid request body" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid token" })
  @ApiForbiddenResponse({ description: "Admin role required" })
  @ApiNotFoundResponse({ description: "User not found" })
  updateUserRole(
    @Req() request: RequestWithUser,
    @Param("userId") userId: string,
    @Body() input: UpdateUserRoleDto,
  ): Promise<UserSummary> {
    return this.authService.updateUserRole(request.user, userId, input);
  }

  @Delete("users/:userId")
  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles("ADMIN")
  @HttpCode(204)
  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "Delete user (soft delete, admin only)" })
  @ApiParam({ name: "userId", example: "clx123abc" })
  @ApiNoContentResponse({ description: "User deleted" })
  @ApiBadRequestResponse({ description: "Invalid operation (e.g., self-delete)" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid token" })
  @ApiForbiddenResponse({ description: "Admin role required" })
  @ApiNotFoundResponse({ description: "User not found" })
  async deleteUser(
    @Req() request: RequestWithUser,
    @Param("userId") userId: string,
  ): Promise<void> {
    await this.authService.deleteUser(request.user, userId);
  }
}
