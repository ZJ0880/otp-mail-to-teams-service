import { Module } from "@nestjs/common";
import { AdminAuthController } from "../../adapters/in/http/admin-auth.controller";
import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminAuthService } from "./admin-auth.service";
import { UsersAuthenticationModule } from "../../../users/infrastructure/nest/users-authentication.module";

@Module({
  imports: [UsersAuthenticationModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAuthGuard],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class AdminAuthModule {}

