export interface TeamsNotificationPayload {
  otp: string;
  from: string;
  subject: string;
  receivedAt: Date;
}

export const TEAMS_NOTIFIER_PORT = Symbol("TEAMS_NOTIFIER_PORT");

export interface TeamsNotifierPort {
  send(payload: TeamsNotificationPayload): Promise<void>;
}
