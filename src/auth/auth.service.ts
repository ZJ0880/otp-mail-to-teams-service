import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import { AppConfigService } from "../config/app-config.service";
import { PrismaService } from "../database/prisma.service";
import { hashPassword, verifyPassword } from "../security/password-hash";
import {
  AuthTokenPayload,
  AuthenticatedUser,
  JwtPayload,
  LoginDto,
  RegisterUserDto,
  UserRole,
  UserSummary,
} from "./auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly prismaService: PrismaService,
  ) {}

  async login(input: LoginDto): Promise<AuthTokenPayload> {
    if (!input?.username || !input?.password) {
      throw new BadRequestException("username and password are required");
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        isActive: true,
        OR: [{ email: input.username }, { name: input.username }],
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
    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      role: user.role,
    };

    const token = jwt.sign(payload, this.appConfigService.jwtSecret, {
      expiresIn: `${this.appConfigService.authTokenTtlMinutes}m`,
    });

    return {
      token,
      expiresAt: new Date(expiresAtEpochMs).toISOString(),
      role: user.role,
      displayName: user.name,
    };
  }

  async registerUser(requester: AuthenticatedUser, input: RegisterUserDto): Promise<UserSummary> {
    if (!input?.email || !input?.name || !input?.password || !input?.role) {
      throw new BadRequestException("email, name, password and role are required");
    }

    this.ensureAdmin(requester.role);

    const existing = await this.prismaService.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new UnauthorizedException("A user with that email already exists");
    }

    const created = await this.prismaService.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        name: input.name.trim(),
        role: input.role,
        isActive: true,
        passwordHash: hashPassword(input.password),
      },
    });

    return this.toSummary(created);
  }

  async listUsers(requester: AuthenticatedUser): Promise<UserSummary[]> {
    this.ensureAdmin(requester.role);

    const users = await this.prismaService.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => this.toSummary(user));
  }

  validateToken(token: string): AuthenticatedUser {
    try {
      const decoded = jwt.verify(token, this.appConfigService.jwtSecret) as JwtPayload;

      return {
        userId: decoded.sub,
        username: decoded.username,
        role: decoded.role,
      };
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  private ensureAdmin(role: UserRole): void {
    if (role !== "ADMIN") {
      throw new UnauthorizedException("Admin role required");
    }
  }

  private toSummary(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserSummary {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
