import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "../contexts/admin-auth/infrastructure/nest/admin-auth.guard";
import { CreateCredentialProfileDto, UpdateCredentialProfileDto, ValidateCredentialProfileDto } from "./settings.dto";
import { SettingsService } from "./settings.service";
import { SettingsValidationResult } from "./settings.types";

interface RequestWithAdmin {
  admin: {
    adminId: string;
    username: string;
  };
}

@Controller("settings")
@UseGuards(AdminAuthGuard)
@ApiTags("Settings")
@ApiBearerAuth("bearer")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("profiles")
  @ApiOperation({ summary: "List credential profiles for current user" })
  @ApiOkResponse({ description: "Credential profile list" })
  listProfiles(@Req() request: RequestWithAdmin) {
    return this.settingsService.listProfiles(request.admin.adminId);
  }

  @Get("profiles/:profileId")
  @ApiOperation({ summary: "Get credential profile by id" })
  @ApiParam({ name: "profileId", example: "clx123abc" })
  @ApiOkResponse({ description: "Credential profile detail" })
  getProfile(@Req() request: RequestWithAdmin, @Param("profileId") profileId: string) {
    return this.settingsService.getProfileOrFail(request.admin.adminId, profileId);
  }

  @Post("profiles")
  @ApiOperation({ summary: "Create credential profile" })
  @ApiBody({ type: CreateCredentialProfileDto })
  @ApiOkResponse({ description: "Credential profile created" })
  createProfile(@Req() request: RequestWithAdmin, @Body() dto: CreateCredentialProfileDto) {
    return this.settingsService.createProfile(request.admin.adminId, dto);
  }

  @Patch("profiles/:profileId")
  @ApiOperation({ summary: "Update credential profile" })
  @ApiParam({ name: "profileId", example: "clx123abc" })
  @ApiBody({ type: UpdateCredentialProfileDto })
  @ApiOkResponse({ description: "Credential profile updated" })
  updateProfile(
    @Req() request: RequestWithAdmin,
    @Param("profileId") profileId: string,
    @Body() dto: UpdateCredentialProfileDto,
  ) {
    return this.settingsService.updateProfile(request.admin.adminId, profileId, dto);
  }

  @Post("profiles/validate")
  @ApiOperation({ summary: "Validate credential profile payload without saving" })
  @ApiBody({ type: ValidateCredentialProfileDto })
  @ApiOkResponse({ description: "Validation result" })
  validateProfile(@Body() dto: ValidateCredentialProfileDto): SettingsValidationResult {
    return this.settingsService.validateProfile(dto);
  }
}
