import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { AppConfigService } from "../../config/app-config.service";
import { TeamsNotificationPayload, TeamsNotifierPort } from "../domain/teams-notifier.port";

@Injectable()
export class TeamsWebhookNotifierService implements TeamsNotifierPort {
  private readonly logger = new Logger(TeamsWebhookNotifierService.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async send(payload: TeamsNotificationPayload): Promise<void> {
    const receivedAt = payload.receivedAt.toISOString().replace("T", " ").replace(".000Z", " UTC");

    const messageText = this.normalizeTemplate(this.appConfigService.teamsMessageTemplate)
      .replaceAll("{otp}", payload.otp)
      .replaceAll("{from}", payload.from.trim())
      .replaceAll("{subject}", payload.subject.trim())
      .replaceAll("{receivedAt}", receivedAt);

    const workflowPayload = {
      type: "message",
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: {
            $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
            type: "AdaptiveCard",
            version: "1.4",
            body: [
              {
                type: "TextBlock",
                text: "OTP ALERTA",
                size: "Medium",
                weight: "Bolder",
                wrap: true,
              },
              {
                type: "TextBlock",
                text: messageText,
                wrap: true,
              },
            ],
          },
        },
      ],
    };

    try {
      this.logger.log("Sending OTP notification to Teams webhook.");
      await axios.post(this.appConfigService.teamsWebhookUrl, workflowPayload, {
        timeout: 7000,
      });
      this.logger.log("Teams webhook accepted the adaptive card payload.");
    } catch {
      // Fallback for classic incoming webhook endpoints.
      this.logger.warn("Adaptive card payload failed, trying classic text payload fallback.");
      await axios.post(
        this.appConfigService.teamsWebhookUrl,
        {
          text: messageText,
        },
        {
          timeout: 7000,
        },
      );
      this.logger.log("Teams webhook accepted the classic text payload fallback.");
    }
  }

  private normalizeTemplate(template: string): string {
    return template.replaceAll("\\\\n", "\n").replaceAll("\\\\t", "\t");
  }
}
