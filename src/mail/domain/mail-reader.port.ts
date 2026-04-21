import type { MailMessage } from "./mail-message.interface";

export const MAIL_READER_PORT = Symbol("MAIL_READER_PORT");

export interface MailReaderPort {
  fetchUnreadMessages(limit?: number): Promise<MailMessage[]>;
  acknowledgeMessage(uid: string): Promise<void>;
}
