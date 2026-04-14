import { Module } from "@nestjs/common";
import { ImapMailReaderService } from "./infrastructure/imap-mail-reader.service";
import { MAIL_READER_PORT } from "./domain/mail-reader.port";

@Module({
  providers: [
    ImapMailReaderService,
    {
      provide: MAIL_READER_PORT,
      useExisting: ImapMailReaderService,
    },
  ],
  exports: [MAIL_READER_PORT],
})
export class MailModule {}
