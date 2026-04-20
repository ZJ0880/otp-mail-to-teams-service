import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
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
@ApiTags("Settings")
@ApiBearerAuth("bearer")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("profiles")
  @Roles("ADMIN", "OPERATOR", "VIEWER")
  @ApiOperation({ summary: "List credential profiles for current user" })
  @ApiOkResponse({ description: "Credential profile list" })
  listProfiles(@Req() request: RequestWithUser) {
    return this.settingsService.listProfiles(request.user.userId);
  }

  @Get("profiles/:profileId")
  @Roles("ADMIN", "OPERATOR", "VIEWER")
  @ApiOperation({ summary: "Get credential profile by id" })
  @ApiParam({ name: "profileId", example: "clx123abc" })
  @ApiOkResponse({ description: "Credential profile detail" })
  getProfile(@Req() request: RequestWithUser, @Param("profileId") profileId: string) {
    return this.settingsService.getProfileOrFail(request.user.userId, profileId);
  }

  @Post("profiles")
  @Roles("ADMIN", "OPERATOR")
  @ApiOperation({ summary: "Create credential profile" })
  @ApiBody({ type: CreateCredentialProfileDto })
  @ApiOkResponse({ description: "Credential profile created" })
  createProfile(@Req() request: RequestWithUser, @Body() dto: CreateCredentialProfileDto) {
    return this.settingsService.createProfile(request.user.userId, dto);
  }

  @Patch("profiles/:profileId")
  @Roles("ADMIN", "OPERATOR")
  @ApiOperation({ summary: "Update credential profile" })
  @ApiParam({ name: "profileId", example: "clx123abc" })
  @ApiBody({ type: UpdateCredentialProfileDto })
  @ApiOkResponse({ description: "Credential profile updated" })
  updateProfile(
    @Req() request: RequestWithUser,
    @Param("profileId") profileId: string,
    @Body() dto: UpdateCredentialProfileDto,
  ) {
    return this.settingsService.updateProfile(request.user.userId, profileId, dto);
  }

  @Post("profiles/validate")
  @Roles("ADMIN", "OPERATOR")
  @ApiOperation({ summary: "Validate credential profile payload without saving" })
  @ApiBody({ type: ValidateCredentialProfileDto })
  @ApiOkResponse({ description: "Validation result" })
  validateProfile(@Body() dto: ValidateCredentialProfileDto): SettingsValidationResult {
    return this.settingsService.validateProfile(dto);
  }
}
