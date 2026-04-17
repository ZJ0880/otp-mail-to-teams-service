import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { CredentialProfilesRepository, CreateCredentialProfileInput, CredentialProfileView } from "../database/credential-profiles.repository";
import { PrismaService } from "../database/prisma.service";
import { CreateCredentialProfileDto, UpdateCredentialProfileDto, ValidateCredentialProfileDto } from "./settings.dto";
import { SettingsValidationResult } from "./settings.types";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly credentialProfilesRepository: CredentialProfilesRepository,
  ) {}

  async listProfiles(userId: string): Promise<CredentialProfileView[]> {
    return this.credentialProfilesRepository.findByOwner(userId);
  }

  async createProfile(userId: string, dto: CreateCredentialProfileDto): Promise<CredentialProfileView> {
    this.validatePatterns(dto.otpRegexPatterns);

    const input: CreateCredentialProfileInput = {
      ownerUserId: userId,
      profileName: dto.profileName,
      mailHost: dto.mailHost,
      mailPort: dto.mailPort,
      mailSecure: dto.mailSecure,
      mailUser: dto.mailUser,
      mailMailbox: dto.mailMailbox,
      mailPassword: dto.mailPassword,
      teamsWebhookUrl: dto.teamsWebhookUrl,
      teamsMessageTemplate: dto.teamsMessageTemplate,
      allowedFromCsv: dto.allowedFromCsv,
      subjectKeywordsCsv: dto.subjectKeywordsCsv,
      otpRegexPatterns: dto.otpRegexPatterns,
      otpTtlMinutes: dto.otpTtlMinutes,
      isDefault: dto.isDefault,
    };

    const profile = await this.credentialProfilesRepository.create(input);
    await this.ensureDefaultSelection(userId, profile.id, profile.isDefault);
    return profile;
  }

  async updateProfile(
    userId: string,
    profileId: string,
    dto: UpdateCredentialProfileDto,
  ): Promise<CredentialProfileView> {
    if (dto.otpRegexPatterns) {
      this.validatePatterns(dto.otpRegexPatterns);
    }

    const profile = await this.credentialProfilesRepository.update(profileId, userId, dto);
    await this.ensureDefaultSelection(userId, profile.id, profile.isDefault);
    return profile;
  }

  async getProfileOrFail(userId: string, profileId: string): Promise<CredentialProfileView> {
    const profiles = await this.credentialProfilesRepository.findByOwner(userId);
    const profile = profiles.find((item) => item.id === profileId);

    if (!profile) {
      throw new NotFoundException("Credential profile not found");
    }

    return profile;
  }

  validateProfile(dto: ValidateCredentialProfileDto): SettingsValidationResult {
    const issues: SettingsValidationResult["issues"] = [];
    const warnings: string[] = [];

    if (!this.isValidTemplate(dto.teamsMessageTemplate)) {
      warnings.push("La plantilla no incluye placeholders esperados como {otp} o {receivedAt}.");
    }

    try {
      this.validatePatterns(dto.otpRegexPatterns);
    } catch (error) {
      issues.push({
        field: "otpRegexPatterns",
        message: error instanceof Error ? error.message : "Regex invalida",
      });
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }

  private validatePatterns(patterns: string): void {
    const rawPatterns = patterns
      .split("||")
      .map((pattern) => pattern.trim())
      .filter((pattern) => pattern.length > 0);

    if (rawPatterns.length === 0) {
      throw new BadRequestException("At least one OTP regex pattern is required");
    }

    for (const pattern of rawPatterns) {
      try {
        // eslint-disable-next-line no-new
        new RegExp(pattern, "gi");
      } catch {
        throw new BadRequestException(`Invalid regex pattern: ${pattern}`);
      }
    }
  }

  private isValidTemplate(template: string): boolean {
    return template.includes("{otp}") || template.includes("{receivedAt}");
  }

  private async ensureDefaultSelection(userId: string, profileId: string, isDefault: boolean): Promise<void> {
    if (!isDefault) {
      return;
    }

    await this.prismaService.credentialProfile.updateMany({
      where: {
        ownerUserId: userId,
        id: { not: profileId },
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });
  }
}
