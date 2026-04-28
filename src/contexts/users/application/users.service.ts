import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY_PORT } from "../infrastructure/nest/users-persistence.tokens";
import { UserRepositoryPort } from "./ports/out/user-repository.port";
import { PASSWORD_HASH_PORT } from "../infrastructure/nest/users-security.tokens";
import { PasswordHashPort } from "./ports/out/password-hash.port";

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY_PORT) private readonly usersRepository: UserRepositoryPort,
    @Inject(PASSWORD_HASH_PORT) private readonly passwordHasher: PasswordHashPort,
  ) {}

  async createUser(input: { name: string; lastName?: string; document?: string; email: string; password: string; role?: "USER" | "ADMIN" }) {
    const existing = await this.usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = this.passwordHasher.hash(input.password);

    const created = await this.usersRepository.create({
      name: input.name,
      lastName: input.lastName,
      document: input.document,
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role ?? "USER",
    });

    return created;
  }
}
