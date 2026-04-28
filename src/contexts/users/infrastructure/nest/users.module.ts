import { Module } from "@nestjs/common";
import { UsersService } from "../../application/users.service";
import { PublicUsersController } from "../../adapters/in/http/public-users.controller";
import { AdminUsersController } from "../../adapters/in/http/admin-users.controller";
import { AdminAuthModule } from "../../../admin-auth/infrastructure/nest/admin-auth.module";
import { UsersPersistenceModule } from "./users-persistence.module";

@Module({
  imports: [AdminAuthModule, UsersPersistenceModule],
  controllers: [PublicUsersController, AdminUsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
