import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { AppConfigService } from "../../../../../../config/app-config.service";
import { ApprovalTokenPayload, ApprovalTokenServicePort } from "../../../../application/ports/out/approval-token-service.port";
import { CredentialRequestId, DecisionType, Instant } from "../../../../domain";

interface JwtApprovalTokenClaims {
  requestId: string;
  decision: DecisionType;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtApprovalTokenService implements ApprovalTokenServicePort {
  constructor(private readonly appConfigService: AppConfigService) {}

  async verify(token: string): Promise<ApprovalTokenPayload> {
    try {
      const decoded = jwt.verify(token, this.appConfigService.approvalLinkSecret, {
        issuer: "otp-mail-to-teams-service",
        audience: "approval-links",
      }) as JwtApprovalTokenClaims;

      if (decoded.decision !== "APPROVE" && decoded.decision !== "REJECT") {
        throw new Error("Invalid decision");
      }

      if (typeof decoded.iat !== "number" || typeof decoded.exp !== "number") {
        throw new TypeError("Missing token timestamps");
      }

      return {
        requestId: CredentialRequestId.from(decoded.requestId),
        decision: decoded.decision,
        issuedAt: Instant.fromDate(new Date(decoded.iat * 1000)),
        expiresAt: Instant.fromDate(new Date(decoded.exp * 1000)),
      };
    } catch {
      throw new UnauthorizedException("Invalid or expired approval token");
    }
  }
}