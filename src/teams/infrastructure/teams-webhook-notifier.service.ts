import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { AppConfigService } from "../../config/app-config.service";
import { TeamsNotificationPayload, TeamsNotifierPort } from "../domain/teams-notifier.port";
import { buildTeamsWorkflowPayload } from "./teams-card.builder";

@Injectable()
export class TeamsWebhookNotifierService implements TeamsNotifierPort {
  private readonly logger = new Logger(TeamsWebhookNotifierService.name);

  constructor(private readonly appConfigService: AppConfigService) {}

  async send(payload: TeamsNotificationPayload): Promise<void> {
    const webhookUrl = this.ensureHttpsUrl(this.appConfigService.teamsWebhookUrl);
    const receivedAt = this.formatReceivedAt(payload.receivedAt);

    this.logger.log(
      `Preparing Teams notification. sender=${payload.from.trim()} subject=${payload.subject.trim()} receivedAt=${receivedAt}`,
    );

    const messageText = this.normalizeTemplate(this.appConfigService.teamsMessageTemplate)
      .replaceAll("{otp}", payload.otp)
      .replaceAll("{from}", payload.from.trim())
      .replaceAll("{subject}", payload.subject.trim())
      .replaceAll("{receivedAt}", receivedAt);

    const cleanedMessageText = this.removeRedundantAlertTitle(messageText);
    const adaptiveCard = {
      $schema: "https://adaptivecards.io/schemas/adaptive-card.json",
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "ALERTA OTP",
          size: "Medium",
          weight: "Bolder",
          wrap: true,
        },
        {
          type: "TextBlock",
          text: cleanedMessageText,
          wrap: true,
        },
      ],
    };

    const workflowPayload = buildTeamsWorkflowPayload(adaptiveCard, cleanedMessageText);

    try {
      this.logger.log("Sending code to Teams using adaptive card payload.");
      await axios.post(webhookUrl, workflowPayload, {
        timeout: 7000,
      });
      this.logger.log("Code sent to Teams successfully using adaptive card payload.");
    } catch {
      this.logger.warn("Adaptive card payload failed, using plain text fallback.");
      await axios.post(
        webhookUrl,
        {
          text: cleanedMessageText,
        },
        {
          timeout: 7000,
        },
      );
      this.logger.log("Code sent to Teams successfully using plain text fallback.");
    }
  }

  async sendAdaptiveCard(
    webhookUrl: string,
    adaptiveCard: Record<string, unknown>,
    fallbackText: string,
  ): Promise<void> {
    const safeWebhookUrl = this.ensureHttpsUrl(webhookUrl);
    const workflowPayload = buildTeamsWorkflowPayload(adaptiveCard, fallbackText);

    try {
      this.logger.log("Sending approval adaptive card payload to Teams/Flow endpoint.");
      const response = await axios.post(safeWebhookUrl, workflowPayload, {
        timeout: 7000,
      });
      this.logger.log(`Approval card request accepted with status ${response.status}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Approval card adaptive payload failed: ${message}`);
      this.logger.warn("Falling back to plain text approval notification.");

      await axios.post(
        safeWebhookUrl,
        { text: fallbackText },
        {
          timeout: 7000,
        },
      );

      this.logger.log("Approval notification sent using plain text fallback.");
    }
  }

  private normalizeTemplate(template: string): string {
    const escapedNewline = String.raw`\n`;
    const escapedTab = String.raw`\t`;
    return template.replaceAll(escapedNewline, "\n").replaceAll(escapedTab, "\t");
  }

  private removeRedundantAlertTitle(messageText: string): string {
    const trimmedStart = messageText.trimStart();
    const uppercaseText = trimmedStart.toUpperCase();
    const titleCandidates = ["ALERTA OTP", "OTP ALERT", "**ALERTA OTP**", "**OTP ALERT**"];

    let cleaned = trimmedStart;
    let removedTitle = false;

    for (const title of titleCandidates) {
      if (uppercaseText.startsWith(title)) {
        cleaned = trimmedStart.slice(title.length);
        removedTitle = true;
        break;
      }
    }

    if (!removedTitle) {
      return messageText;
    }

    while (cleaned.startsWith("\r") || cleaned.startsWith("\n")) {
      cleaned = cleaned.slice(1);
    }

    return cleaned;
  }

  private formatReceivedAt(date: Date): string {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);

    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const period = hours >= 12 ? "PM" : "AM";

    const hour12 = hours % 12 || 12;
    const hourText = String(hour12).padStart(2, "0");
    return `${day}/${month}/${year} ${hourText}:${minutes} ${period}`;
  }

  private ensureHttpsUrl(url: string): string {
    return url.startsWith("http://") ? `https://${url.slice(7)}` : url;
  }

}
