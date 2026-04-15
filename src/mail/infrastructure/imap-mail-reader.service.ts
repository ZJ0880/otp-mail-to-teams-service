import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { AppConfigService } from "../../config/app-config.service";
import { MailMessage } from "../domain/mail-message.interface";
import { MailReaderPort } from "../domain/mail-reader.port";

@Injectable()
export class ImapMailReaderService implements MailReaderPort, OnModuleDestroy {
  private readonly logger = new Logger(ImapMailReaderService.name);
  private client?: ImapFlow;

  constructor(private readonly appConfigService: AppConfigService) {}

  async fetchUnreadMessages(limit = 20): Promise<MailMessage[]> {
    await this.ensureConnected();
    const client = this.requireClient();

    this.logger.log(
      `Searching unread messages in mailbox ${this.appConfigService.mailMailbox} with limit ${limit}.`,
    );
    const mailboxLock = await client.getMailboxLock(this.appConfigService.mailMailbox);

    try {
      const searchResult = await client.search({ seen: false });
      const uids = Array.isArray(searchResult) ? searchResult : [];
      this.logger.log(`Unread UID count found: ${uids.length}`);
      if (uids.length === 0) {
        return [];
      }

      const selected = uids.slice(-limit).reverse();
      const messages = await Promise.all(
        selected.map(async (uid: number): Promise<MailMessage | null> => {
          const message = await client.fetchOne(uid, {
            uid: true,
            source: true,
            envelope: true,
            internalDate: true,
          });

          if (!message || !message.source) {
            return null;
          }

          const parsed = await simpleParser(message.source);
          const bodyText = parsed.text ?? "";
          const fromHeader = parsed.from?.text ?? message.envelope?.from?.[0]?.address ?? "unknown";
          const subject = parsed.subject ?? message.envelope?.subject ?? "(no subject)";
          const rawReceivedAt = parsed.date ?? message.internalDate ?? new Date();
          const receivedAt = rawReceivedAt instanceof Date ? rawReceivedAt : new Date(rawReceivedAt);

          this.logger.log(
            `Prepared message uid=${message.uid} subject=${subject} from=${fromHeader} receivedAt=${receivedAt.toISOString()}`,
          );

          return {
            uid: String(message.uid),
            subject,
            from: fromHeader,
            receivedAt,
            bodyText,
            messageId: parsed.messageId ?? undefined,
          };
        }),
      );

      return messages.filter((item: MailMessage | null): item is MailMessage => item !== null);
    } finally {
      mailboxLock.release();
    }
  }

  async acknowledgeMessage(uid: string): Promise<void> {
    await this.ensureConnected();
    const client = this.requireClient();

    this.logger.log(`Marking message as seen uid=${uid}.`);
    const mailboxLock = await client.getMailboxLock(this.appConfigService.mailMailbox);
    try {
      await client.messageFlagsAdd(Number(uid), ["\\Seen"]);
      this.logger.log(`Message marked as seen uid=${uid}.`);
    } finally {
      mailboxLock.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.logout();
      this.client = undefined;
    }
  }

  private async ensureConnected(): Promise<void> {
    if (this.client?.usable) {
      return;
    }

    this.logger.log(
      `Connecting to IMAP host=${this.appConfigService.mailHost}:${this.appConfigService.mailPort} mailbox=${this.appConfigService.mailMailbox}.`,
    );
    this.client = new ImapFlow({
      host: this.appConfigService.mailHost,
      port: this.appConfigService.mailPort,
      secure: this.appConfigService.mailSecure,
      auth: {
        user: this.appConfigService.mailUser,
        pass: this.appConfigService.mailPassword,
      },
      logger: false,
    });

    this.client.on("error", (error) => {
      this.logger.error(`IMAP error: ${error.message}`);
    });

    await this.client.connect();
    await this.client.mailboxOpen(this.appConfigService.mailMailbox);
    this.logger.log(`Connected to mailbox ${this.appConfigService.mailMailbox}`);
  }

  private requireClient(): ImapFlow {
    if (!this.client) {
      throw new Error("IMAP client not initialized");
    }

    return this.client;
  }
}
