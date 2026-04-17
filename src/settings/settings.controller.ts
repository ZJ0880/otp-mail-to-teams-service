import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { TokenAuthGuard } from "../auth/token-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { CreateCredentialProfileDto, UpdateCredentialProfileDto, ValidateCredentialProfileDto } from "./settings.dto";
import { SettingsService } from "./settings.service";
import { SettingsValidationResult } from "./settings.types";

interface RequestWithUser {
  user: {
    userId: string;
    username: string;
    role: string;
  };
}

@Controller("settings")
@UseGuards(TokenAuthGuard, RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("profiles")
  @Roles("ADMIN", "OPERATOR", "VIEWER")
  listProfiles(@Req() request: RequestWithUser) {
    return this.settingsService.listProfiles(request.user.userId);
  }

  @Get("profiles/:profileId")
  @Roles("ADMIN", "OPERATOR", "VIEWER")
  getProfile(@Req() request: RequestWithUser, @Param("profileId") profileId: string) {
    return this.settingsService.getProfileOrFail(request.user.userId, profileId);
  }

  @Post("profiles")
  @Roles("ADMIN", "OPERATOR")
  createProfile(@Req() request: RequestWithUser, @Body() dto: CreateCredentialProfileDto) {
    return this.settingsService.createProfile(request.user.userId, dto);
  }

  @Patch("profiles/:profileId")
  @Roles("ADMIN", "OPERATOR")
  updateProfile(
    @Req() request: RequestWithUser,
    @Param("profileId") profileId: string,
    @Body() dto: UpdateCredentialProfileDto,
  ) {
    return this.settingsService.updateProfile(request.user.userId, profileId, dto);
  }

  @Post("profiles/validate")
  @Roles("ADMIN", "OPERATOR")
  validateProfile(@Body() dto: ValidateCredentialProfileDto): SettingsValidationResult {
    return this.settingsService.validateProfile(dto);
  }
}
