import { Injectable } from "@nestjs/common";
import { CredentialProfile, Prisma } from "@prisma/client";
import { SecretEncryptionService } from "../security/secret-encryption.service";
import { PrismaService } from "./prisma.service";

export interface CreateCredentialProfileInput {
  ownerUserId: string;
  profileName: string;
  mailHost: string;
  mailPort: number;
  mailSecure: boolean;
  mailUser: string;
  mailMailbox: string;
  mailPassword: string;
  teamsWebhookUrl: string;
  teamsMessageTemplate: string;
  allowedFromCsv?: string;
  subjectKeywordsCsv?: string;
  otpRegexPatterns: string;
  otpTtlMinutes: number;
  isDefault?: boolean;
}

export interface CredentialProfileView {
  id: string;
  ownerUserId: string;
  profileName: string;
  mailHost: string;
  mailPort: number;
  mailSecure: boolean;
  mailUser: string;
  mailMailbox: string;
  teamsMessageTemplate: string;
  allowedFromCsv: string | null;
  subjectKeywordsCsv: string | null;
  otpRegexPatterns: string;
  otpTtlMinutes: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  maskedMailPassword: string;
  maskedTeamsWebhook: string;
}

@Injectable()
export class CredentialProfilesRepository {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly secretEncryptionService: SecretEncryptionService,
  ) {}

  async create(input: CreateCredentialProfileInput): Promise<CredentialProfileView> {
    const created = await this.prismaService.credentialProfile.create({
      data: {
        ownerUserId: input.ownerUserId,
        profileName: input.profileName,
        mailHost: input.mailHost,
        mailPort: input.mailPort,
        mailSecure: input.mailSecure,
        mailUser: input.mailUser,
        mailMailbox: input.mailMailbox,
        mailPasswordEncrypted: this.secretEncryptionService.encrypt(input.mailPassword),
        teamsWebhookEncrypted: this.secretEncryptionService.encrypt(input.teamsWebhookUrl),
        teamsMessageTemplate: input.teamsMessageTemplate,
        allowedFromCsv: input.allowedFromCsv,
        subjectKeywordsCsv: input.subjectKeywordsCsv,
        otpRegexPatterns: input.otpRegexPatterns,
        otpTtlMinutes: input.otpTtlMinutes,
        isDefault: input.isDefault ?? false,
      },
    });

    return this.toView(created);
  }

  async update(
    profileId: string,
    ownerUserId: string,
    input: Partial<Omit<CreateCredentialProfileInput, "ownerUserId">>,
  ): Promise<CredentialProfileView> {
    const data: Prisma.CredentialProfileUpdateInput = {
      profileName: input.profileName,
      mailHost: input.mailHost,
      mailPort: input.mailPort,
      mailSecure: input.mailSecure,
      mailUser: input.mailUser,
      mailMailbox: input.mailMailbox,
      teamsMessageTemplate: input.teamsMessageTemplate,
      allowedFromCsv: input.allowedFromCsv,
      subjectKeywordsCsv: input.subjectKeywordsCsv,
      otpRegexPatterns: input.otpRegexPatterns,
      otpTtlMinutes: input.otpTtlMinutes,
      isDefault: input.isDefault,
    };

    if (typeof input.mailPassword === "string") {
      data.mailPasswordEncrypted = this.secretEncryptionService.encrypt(input.mailPassword);
    }

    if (typeof input.teamsWebhookUrl === "string") {
      data.teamsWebhookEncrypted = this.secretEncryptionService.encrypt(input.teamsWebhookUrl);
    }

    const updated = await this.prismaService.credentialProfile.update({
      where: {
        id_ownerUserId: {
          id: profileId,
          ownerUserId,
        },
      },
      data,
    });

    return this.toView(updated);
  }

  async findByOwner(ownerUserId: string): Promise<CredentialProfileView[]> {
    const profiles = await this.prismaService.credentialProfile.findMany({
      where: { ownerUserId },
      orderBy: { updatedAt: "desc" },
    });

    return profiles.map((profile) => this.toView(profile));
  }

  async getSecrets(profileId: string, ownerUserId: string): Promise<{ mailPassword: string; teamsWebhookUrl: string }> {
    const profile = await this.prismaService.credentialProfile.findUniqueOrThrow({
      where: {
        id_ownerUserId: {
          id: profileId,
          ownerUserId,
        },
      },
    });

    return {
      mailPassword: this.secretEncryptionService.decrypt(profile.mailPasswordEncrypted),
      teamsWebhookUrl: this.secretEncryptionService.decrypt(profile.teamsWebhookEncrypted),
    };
  }

  private toView(profile: CredentialProfile): CredentialProfileView {
    return {
      id: profile.id,
      ownerUserId: profile.ownerUserId,
      profileName: profile.profileName,
      mailHost: profile.mailHost,
      mailPort: profile.mailPort,
      mailSecure: profile.mailSecure,
      mailUser: profile.mailUser,
      mailMailbox: profile.mailMailbox,
      teamsMessageTemplate: profile.teamsMessageTemplate,
      allowedFromCsv: profile.allowedFromCsv,
      subjectKeywordsCsv: profile.subjectKeywordsCsv,
      otpRegexPatterns: profile.otpRegexPatterns,
      otpTtlMinutes: profile.otpTtlMinutes,
      isDefault: profile.isDefault,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      maskedMailPassword: this.maskSecret(this.secretEncryptionService.decrypt(profile.mailPasswordEncrypted)),
      maskedTeamsWebhook: this.maskUrl(this.secretEncryptionService.decrypt(profile.teamsWebhookEncrypted)),
    };
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 4) {
      return "****";
    }

    return `${"*".repeat(secret.length - 4)}${secret.slice(-4)}`;
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}/***`;
    } catch {
      return "***";
    }
  }
}
