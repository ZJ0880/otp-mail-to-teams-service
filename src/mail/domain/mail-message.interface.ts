export interface MailMessage {
  uid: string;
  subject: string;
  from: string;
  receivedAt: Date;
  bodyText: string;
  messageId?: string;
}
