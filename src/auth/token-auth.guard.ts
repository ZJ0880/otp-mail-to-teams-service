import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthenticatedUser } from "./auth.types";

interface RequestWithUser {
  headers: {
    authorization?: string;
  };
  user?: {
    userId: string;
    username: string;
    role: string;
  };
}

@Injectable()
export class TokenAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const token = authorization.slice("Bearer ".length).trim();
    const user: AuthenticatedUser = this.authService.validateToken(token);
    request.user = user;
    return true;
  }
}
