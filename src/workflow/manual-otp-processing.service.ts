import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { MailMessage } from "../mail/domain/mail-message.interface";
import { OtpProcessingResult } from "./otp-processing.service";
import { ManualProcessTicketsDto } from "./manual-process.dto";

@Injectable()
export class ManualOtpProcessingService {
  private readonly logger = new Logger(ManualOtpProcessingService.name);

  async processUnreadMessages(input: ManualProcessTicketsDto): Promise<OtpProcessingResult> {
    // Use provided values or defaults
    const mailHost = input.mailHost || 'imap.gmail.com';
    const mailPort = input.mailPort ?? 993;
    const mailSecure = input.mailSecure ?? true;
    const mailMailbox = input.mailMailbox || 'INBOX';
    const otpRegexPatterns = input.otpRegexPatterns || '(\\d{6})';
    const otpTtlMinutes = input.otpTtlMinutes ?? 5;
    const teamsMessageTemplate = input.teamsMessageTemplate || 'Codigo OTP: {otp} | Remitente: {from} | Asunto: {subject}';

    const patterns = this.parsePatterns(otpRegexPatterns);
    const allowedSenders = this.parseCsv(input.allowedFromCsv);
    const keywords = this.parseCsv(input.subjectKeywordsCsv);

    const client = new ImapFlow({
      host: mailHost,
      port: mailPort,
      secure: mailSecure,
      auth: {
        user: input.mailUser,
        pass: input.mailPassword,
      },
      logger: false,
    });

    const result: OtpProcessingResult = {
      unreadCount: 0,
      processedCount: 0,
      sentCount: 0,
      filteredCount: 0,
      notFoundCount: 0,
      expiredCount: 0,
      errorCount: 0,
    };

    try {
      await client.connect();
      const mailboxLock = await client.getMailboxLock(mailMailbox);

      try {
        const searchResult = await client.search({ seen: false });
        const uids = Array.isArray(searchResult) ? searchResult : [];
        const limit = input.limit ?? 20;
        const selected = uids.slice(-limit).reverse();
        result.unreadCount = selected.length;

        for (const uid of selected) {
          const parsed = await this.fetchMessage(client, uid);
          if (!parsed) {
            continue;
          }

          result.processedCount += 1;

          if (!this.isRelevant(parsed, allowedSenders, keywords)) {
            result.filteredCount += 1;
            await client.messageFlagsAdd(uid, [String.raw`\Seen`]);
            continue;
          }

          const extractedCode = this.extractCode(parsed, patterns);
          if (!extractedCode) {
            result.notFoundCount += 1;
            await client.messageFlagsAdd(uid, [String.raw`\Seen`]);
            continue;
          }

          if (!this.isCurrent(parsed.receivedAt, otpTtlMinutes)) {
            result.expiredCount += 1;
            await client.messageFlagsAdd(uid, [String.raw`\Seen`]);
            continue;
          }

          await this.sendToTeams(input.teamsWebhookUrl, teamsMessageTemplate, parsed, extractedCode);
          result.sentCount += 1;
          await client.messageFlagsAdd(uid, [String.raw`\Seen`]);
        }
      } finally {
        mailboxLock.release();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Manual processing failed: ${message}`);
      throw new BadRequestException(`Manual processing failed: ${message}`);
    } finally {
      try {
        if (client.usable) {
          await client.logout();
        }
      } catch {
        // ignore shutdown errors
      }
    }

    return result;
  }

  private async fetchMessage(client: ImapFlow, uid: number): Promise<MailMessage | null> {
    const message = await client.fetchOne(uid, {
      uid: true,
      source: true,
      envelope: true,
      internalDate: true,
    });

    if (message === false || !message.source) {
      return null;
    }

    const parsed = await simpleParser(message.source);
    const bodyText = parsed.text ?? "";
    const fromHeader = parsed.from?.text ?? message.envelope?.from?.[0]?.address ?? "unknown";
    const subject = parsed.subject ?? message.envelope?.subject ?? "(no subject)";
    const rawReceivedAt = parsed.date ?? message.internalDate ?? new Date();
    const receivedAt = rawReceivedAt instanceof Date ? rawReceivedAt : new Date(rawReceivedAt);

    return {
      uid: String(message.uid),
      subject,
      from: fromHeader,
      receivedAt,
      bodyText,
      messageId: parsed.messageId ?? undefined,
    };
  }

  private isRelevant(message: MailMessage, allowedSenders: string[], keywords: string[]): boolean {
    const from = message.from.toLowerCase();
    const subject = message.subject.toLowerCase();

    if (allowedSenders.length > 0 && !allowedSenders.some((sender) => from.includes(sender))) {
      return false;
    }

    if (keywords.length > 0 && !keywords.some((keyword) => subject.includes(keyword))) {
      return false;
    }

    return true;
  }

  private extractCode(message: MailMessage, patterns: RegExp[]): string | null {
    for (const source of [message.subject, message.bodyText]) {
      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(source);
        if (match?.[1]) {
          return match[1];
        }

        if (match?.[0]) {
          return match[0];
        }
      }
    }

    return null;
  }

  private isCurrent(receivedAt: Date, ttlMinutes: number): boolean {
    const ageInMs = Date.now() - receivedAt.getTime();
    if (ageInMs < 0) {
      return false;
    }

    return ageInMs <= ttlMinutes * 60 * 1000;
  }

  private async sendToTeams(
    webhookUrl: string,
    template: string,
    message: MailMessage,
    otp: string,
  ): Promise<void> {
    const rendered = template
      .replaceAll("{otp}", otp)
      .replaceAll("{from}", message.from.trim())
      .replaceAll("{subject}", message.subject.trim())
      .replaceAll("{receivedAt}", message.receivedAt.toISOString())
      .replaceAll(String.raw`\n`, "\n")
      .replaceAll(String.raw`\t`, "\t");

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
          text: rendered,
          wrap: true,
        },
      ],
    };

    const payload = {
      type: "message",
      text: rendered,
      body: adaptiveCard,
      attachments: [
        {
          contentType: "application/vnd.microsoft.card.adaptive",
          contentUrl: null,
          content: adaptiveCard,
        },
      ],
    };

    await axios.post(
      webhookUrl,
      payload,
      {
        timeout: 7000,
      },
    );
  }

  private parseCsv(value?: string): string[] {
    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter((item) => item.length > 0);
  }

  private parsePatterns(raw: string): RegExp[] {
    const items = raw
      .split("||")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (items.length === 0) {
      throw new BadRequestException("At least one OTP regex pattern is required");
    }

    return items.map((pattern) => {
      try {
        return new RegExp(pattern, "gi");
      } catch {
        throw new BadRequestException(`Invalid regex pattern: ${pattern}`);
      }
    });
  }
}
