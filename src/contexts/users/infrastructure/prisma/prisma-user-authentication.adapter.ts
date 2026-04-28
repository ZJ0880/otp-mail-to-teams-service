import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { UserRepositoryPort } from "../../application/ports/out/user-repository.port";
import { AuthenticatedUserRecord, UserAuthenticationPort } from "../../application/ports/out/user-authentication.port";
import { verifyPassword } from "../../../../security/password-hash";
import { USER_REPOSITORY_PORT } from "../nest/users-persistence.tokens";

@Injectable()
export class PrismaUserAuthenticationAdapter implements UserAuthenticationPort {
  constructor(@Inject(USER_REPOSITORY_PORT) private readonly userRepository: UserRepositoryPort) {}

  async authenticate(input: { email: string; password: string }): Promise<AuthenticatedUserRecord> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("User is inactive");
    }

    if (!verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return {
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      document: user.document,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
