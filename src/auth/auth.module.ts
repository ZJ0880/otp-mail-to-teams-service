import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenAuthGuard } from "./token-auth.guard";
import { RolesGuard } from "./roles.guard";

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenAuthGuard, RolesGuard],
  exports: [AuthService, TokenAuthGuard, RolesGuard],
})
export class AuthModule {}
