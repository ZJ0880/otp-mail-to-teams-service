import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
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
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() input: LoginDto): Promise<AuthTokenPayload> {
    return this.authService.login(input);
  }

  @Get("me")
  @UseGuards(TokenAuthGuard)
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
  listUsers(@Req() request: RequestWithUser): Promise<UserSummary[]> {
    return this.authService.listUsers(request.user);
  }

  @Post("register")
  @UseGuards(TokenAuthGuard, RolesGuard)
  @Roles("ADMIN")
  register(
    @Req() request: RequestWithUser,
    @Body() input: RegisterUserDto,
  ): Promise<UserSummary> {
    return this.authService.registerUser(request.user, input);
  }
}
