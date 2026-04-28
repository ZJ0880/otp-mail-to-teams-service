import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../../../database/database.module";
import { PrismaUsersRepository } from "../prisma/prisma-users.repository";
import { USER_REPOSITORY_PORT } from "./users-persistence.tokens";

@Module({
  imports: [DatabaseModule],
  providers: [
    PrismaUsersRepository,
    {
      provide: USER_REPOSITORY_PORT,
      useExisting: PrismaUsersRepository,
    },
  ],
  exports: [USER_REPOSITORY_PORT],
})
export class UsersPersistenceModule {}
