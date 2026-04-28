import { Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma.service";
import { CreateUserInput, UserRecord, UserRepositoryPort } from "../../application/ports/out/user-repository.port";

@Injectable()
export class PrismaUsersRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserInput): Promise<UserRecord> {
    const row = await this.prisma.user.create({
      data: {
        name: data.name,
        lastName: data.lastName,
        document: data.document,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role as UserRole,
      },
    });

    return {
      id: row.id,
      name: row.name,
      lastName: row.lastName ?? null,
      document: row.document ?? null,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      lastName: row.lastName ?? null,
      document: row.document ?? null,
      email: row.email,
      passwordHash: row.passwordHash,
      role: row.role,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
