import { Module } from "@nestjs/common";
import { TeamsWebhookNotifierService } from "./infrastructure/teams-webhook-notifier.service";
import { TEAMS_NOTIFIER_PORT } from "./domain/teams-notifier.port";

@Module({
  providers: [
    TeamsWebhookNotifierService,
    {
      provide: TEAMS_NOTIFIER_PORT,
      useExisting: TeamsWebhookNotifierService,
    },
  ],
  exports: [TEAMS_NOTIFIER_PORT],
})
export class TeamsModule {}
