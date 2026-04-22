import { Module } from "@nestjs/common";
import { AdminAuthModule } from "../contexts/admin-auth/infrastructure/nest/admin-auth.module";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
  imports: [AdminAuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
