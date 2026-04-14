export interface OtpRecord {
  code: string;
  matchedPattern: string;
  extractedFrom: "subject" | "body";
}
