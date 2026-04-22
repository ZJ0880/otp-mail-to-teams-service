import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AdminAuthService } from "./admin-auth.service";
import type { AdminSession } from "./admin-auth.types";

interface RequestWithAdmin {
  headers: {
    authorization?: string;
  };
  admin?: AdminSession;
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithAdmin>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorization.slice("Bearer ".length).trim();
    request.admin = this.adminAuthService.validateToken(token);
    return true;
  }
}

