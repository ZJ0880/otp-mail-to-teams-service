import { Module } from "@nestjs/common";
import { UsersPersistenceModule } from "./users-persistence.module";
import { PrismaUserAuthenticationAdapter } from "../prisma/prisma-user-authentication.adapter";
import { USER_AUTHENTICATION_PORT } from "./users-authentication.tokens";

@Module({
  imports: [UsersPersistenceModule],
  providers: [
    PrismaUserAuthenticationAdapter,
    {
      provide: USER_AUTHENTICATION_PORT,
      useExisting: PrismaUserAuthenticationAdapter,
    },
  ],
  exports: [USER_AUTHENTICATION_PORT],
})
export class UsersAuthenticationModule {}
