import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthSessionPayload, AuthTokenPayload, LoginDto, RegisterUserDto, UserSummary } from "./auth.types";
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
}
