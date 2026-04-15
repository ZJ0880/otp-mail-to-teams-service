import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { AppConfigService } from "../../config/app-config.service";
import { TeamsNotificationPayload, TeamsNotifierPort } from "../domain/teams-notifier.port";

@Injectable()
export class TeamsWebhookNotifierService implements TeamsNotifierPort {
  private readonly logger = new Logger(TeamsWebhookNotifierService.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async send(payload: TeamsNotificationPayload): Promise<void> {
    const webhookUrl = this.ensureHttpsUrl(this.appConfigService.teamsWebhookUrl);
    const receivedAt = this.formatReceivedAt(payload.receivedAt);

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
            $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
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
      await axios.post(webhookUrl, workflowPayload, {
        timeout: 7000,
      });
      this.logger.log("Teams webhook accepted the adaptive card payload.");
    } catch {
      // Fallback for classic incoming webhook endpoints.
      this.logger.warn("Adaptive card payload failed, trying classic text payload fallback.");
      await axios.post(
        webhookUrl,
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

  private formatReceivedAt(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";

    hours %= 12;
    if (hours === 0) {
      hours = 12;
    }

    const hourText = String(hours).padStart(2, "0");
    return `${day}/${month}/${year} ${hourText}:${minutes} ${period}`;
  }

  private ensureHttpsUrl(url: string): string {
    return url.startsWith("http://") ? `https://${url.slice(7)}` : url;
  }
}
