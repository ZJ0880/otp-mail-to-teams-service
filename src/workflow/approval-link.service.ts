import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { AppConfigService } from "../config/app-config.service";

export type ApprovalDecision = "approve" | "reject" | "details";

export interface ApprovalLinkPayload {
  requestId: string;
  decision: ApprovalDecision;
  requesterName: string;
  requesterEmail: string;
  platform: string;
  course: string;
  reason?: string;
  requestedAt: string;
}

@Injectable()
export class ApprovalLinkService {
  constructor(private readonly appConfigService: AppConfigService) {}

  createLinkToken(payload: ApprovalLinkPayload): string {
    return jwt.sign(payload, this.appConfigService.approvalLinkSecret, {
      expiresIn: `${this.appConfigService.approvalLinkTtlMinutes}m`,
      issuer: "otp-mail-to-teams-service",
      audience: "approval-links",
    });
  }

  verifyLinkToken(token: string): ApprovalLinkPayload {
    try {
      return jwt.verify(token, this.appConfigService.approvalLinkSecret, {
        issuer: "otp-mail-to-teams-service",
        audience: "approval-links",
      }) as ApprovalLinkPayload;
    } catch {
      throw new UnauthorizedException("Invalid or expired approval link");
    }
  }
}
