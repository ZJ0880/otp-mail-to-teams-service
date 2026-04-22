import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { AppConfigService } from "../../../../config/app-config.service";
import { PrismaService } from "../../../../database/prisma.service";
import { verifyPassword } from "../../../../security/password-hash";
import { AdminTokenPayload, JwtAdminPayload, AdminSession } from "./admin-auth.types";

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async login(input: { username: string; password: string }): Promise<AdminTokenPayload> {
    if (!input?.username || !input?.password) {
      throw new BadRequestException("username and password are required");
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        isActive: true,
        email: input.username,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!user?.passwordHash) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = verifyPassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const expiresAtEpochMs = Date.now() + this.appConfigService.authTokenTtlMinutes * 60 * 1000;
    const payload: JwtAdminPayload = {
      sub: user.id,
      username: user.email,
    };

    const token = jwt.sign(payload, this.appConfigService.jwtSecret, {
      expiresIn: `${this.appConfigService.authTokenTtlMinutes}m`,
      issuer: this.appConfigService.jwtIssuer,
      audience: this.appConfigService.jwtAudience,
    });

    return {
      token,
      expiresAt: new Date(expiresAtEpochMs).toISOString(),
      displayName: user.name,
    };
  }

  validateToken(token: string): AdminSession {
    try {
      const decoded = jwt.verify(token, this.appConfigService.jwtSecret, {
        issuer: this.appConfigService.jwtIssuer,
        audience: this.appConfigService.jwtAudience,
      }) as JwtAdminPayload;

      return {
        adminId: decoded.sub,
        username: decoded.username,
      };
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

