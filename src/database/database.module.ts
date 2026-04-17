import { Global, Module } from "@nestjs/common";
import { CredentialProfilesRepository } from "./credential-profiles.repository";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService, CredentialProfilesRepository],
  exports: [PrismaService, CredentialProfilesRepository],
})
export class DatabaseModule {}
