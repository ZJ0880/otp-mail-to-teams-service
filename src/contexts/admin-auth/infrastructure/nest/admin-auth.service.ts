import { BadRequestException, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { AppConfigService } from "../../../../config/app-config.service";
import { AdminTokenPayload, JwtAdminPayload, AdminSession } from "./admin-auth.types";
import { USER_AUTHENTICATION_PORT } from "../../../users/infrastructure/nest/users-authentication.tokens";
import { UserAuthenticationPort } from "../../../users/application/ports/out/user-authentication.port";


@Injectable()
export class AdminAuthService {
  constructor(
    private readonly appConfigService: AppConfigService,
    @Inject(USER_AUTHENTICATION_PORT) private readonly userAuthentication: UserAuthenticationPort,
  ) {}

  async login(input: { username: string; password: string }): Promise<AdminTokenPayload> {
    if (!input?.username || !input?.password) {
      throw new BadRequestException("username and password are required");
    }

    const username = input.username.trim().toLowerCase();
    const user = await this.userAuthentication.authenticate({
      email: username,
      password: input.password,
    });

    if (user.role !== "ADMIN") {
      throw new UnauthorizedException("Admin role required");
    }

    const expiresAtEpochMs = Date.now() + this.appConfigService.authTokenTtlMinutes * 60 * 1000;
    const payload: JwtAdminPayload = {
      sub: user.id,
      username: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.appConfigService.jwtSecret, {
      expiresIn: `${this.appConfigService.authTokenTtlMinutes}m`,
      issuer: this.appConfigService.jwtIssuer,
      audience: this.appConfigService.jwtAudience,
    });

    return {
      token,
      expiresAt: new Date(expiresAtEpochMs).toISOString(),
      displayName: user.name ?? user.email,
    };
  }

  validateToken(token: string): AdminSession {
    try {
      const decoded = jwt.verify(token, this.appConfigService.jwtSecret, {
        issuer: this.appConfigService.jwtIssuer,
        audience: this.appConfigService.jwtAudience,
      }) as JwtAdminPayload;

      return {
        userId: decoded.sub,
        username: decoded.username,
        role: decoded.role ?? "ADMIN",
      };
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

