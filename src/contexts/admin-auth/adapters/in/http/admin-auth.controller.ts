import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { AdminAuthService } from "../../../infrastructure/nest/admin-auth.service";
import { AdminLoginDto } from "./admin-login.dto";
import { AdminTokenPayload } from "../../../infrastructure/nest/admin-auth.types";

@Controller("auth")
@ApiTags("Auth")
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Authenticate admin and issue JWT token" })
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ description: "Successful login" })
  @ApiUnauthorizedResponse({ description: "Invalid credentials" })
  login(@Body() input: AdminLoginDto): Promise<AdminTokenPayload> {
    return this.adminAuthService.login(input);
  }
}

