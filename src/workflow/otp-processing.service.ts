import { Inject, Injectable, Logger } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { MailMessage } from "../mail/domain/mail-message.interface";
import { MAIL_READER_PORT, MailReaderPort } from "../mail/domain/mail-reader.port";
import { OtpExtractorService } from "../otp/application/otp-extractor.service";
import { OtpValidatorService } from "../otp/application/otp-validator.service";
import { TEAMS_NOTIFIER_PORT, TeamsNotifierPort } from "../teams/domain/teams-notifier.port";

@Injectable()
export class OtpProcessingService {
  private readonly logger = new Logger(OtpProcessingService.name);

  constructor(
    @Inject(MAIL_READER_PORT) private readonly mailReader: MailReaderPort,
    @Inject(TEAMS_NOTIFIER_PORT) private readonly teamsNotifier: TeamsNotifierPort,
    private readonly otpExtractorService: OtpExtractorService,
    private readonly otpValidatorService: OtpValidatorService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async processUnreadMessages(): Promise<void> {
    this.logger.log("Starting unread message processing batch.");
    const messages = await this.mailReader.fetchUnreadMessages();
    this.logger.log(`Unread messages fetched: ${messages.length}`);

    if (messages.length === 0) {
      this.logger.log("No unread messages found.");
      return;
    }

    for (const message of messages) {
      this.logger.log(
        `Evaluating message traceId=${message.messageId ?? message.uid} subject=${message.subject}`,
      );
      await this.processSingleMessage(message);
    }

    this.logger.log("Unread message processing batch completed.");
  }

  private async processSingleMessage(message: MailMessage): Promise<void> {
    const traceId = message.messageId ?? `uid:${message.uid}`;

    try {
      if (!this.isRelevant(message)) {
        this.logger.log(`[${traceId}] Message ignored by filter.`);
        await this.mailReader.acknowledgeMessage(message.uid);
        this.logger.log(`[${traceId}] Message marked as read after filter.`);
        return;
      }

      const extracted = this.otpExtractorService.extract(message.subject, message.bodyText);
      if (!extracted) {
        this.logger.warn(`[${traceId}] No OTP found in message.`);
        await this.mailReader.acknowledgeMessage(message.uid);
        this.logger.log(`[${traceId}] Message marked as read after no OTP match.`);
        return;
      }

      this.logger.log(
        `[${traceId}] OTP pattern matched from ${extracted.extractedFrom} using ${extracted.matchedPattern}.`,
      );

      if (!this.otpValidatorService.isCurrent(message.receivedAt)) {
        this.logger.warn(`[${traceId}] OTP expired.`);
        await this.mailReader.acknowledgeMessage(message.uid);
        this.logger.log(`[${traceId}] Message marked as read after expiry check.`);
        return;
      }

      this.logger.log(`[${traceId}] OTP is current and ready to send.`);

      await this.teamsNotifier.send({
        otp: extracted.code,
        from: message.from,
        subject: message.subject,
        receivedAt: message.receivedAt,
      });

      this.logger.log(`[${traceId}] OTP sent to Teams webhook.`);
      await this.mailReader.acknowledgeMessage(message.uid);
      this.logger.log(`[${traceId}] Message marked as read after successful delivery.`);

      this.logger.log(
        `[${traceId}] OTP published. source=${extracted.extractedFrom} pattern=${extracted.matchedPattern}`,
      );
    } catch (error) {
      const messageError = error instanceof Error ? error.message : String(error);
      this.logger.error(`[${traceId}] Processing failed: ${messageError}`);
    }
  }

  private isRelevant(message: MailMessage): boolean {
    const from = message.from.toLowerCase();
    const subject = message.subject.toLowerCase();

    const allowedSenders = this.appConfigService.mailAllowedFrom;
    if (allowedSenders.length > 0 && !allowedSenders.some((sender) => from.includes(sender))) {
      return false;
    }

    const keywords = this.appConfigService.mailSubjectKeywords;
    if (keywords.length > 0 && !keywords.some((keyword) => subject.includes(keyword))) {
      return false;
    }

    return true;
  }
}
