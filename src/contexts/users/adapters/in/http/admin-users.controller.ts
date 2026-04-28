import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags, ApiBearerAuth, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { AdminAuthGuard } from "../../../../admin-auth/infrastructure/nest/admin-auth.guard";
import { UsersService } from "../../../application/users.service";
import { AdminCreateUserDto } from "./admin-create-user.dto";
import { UserResponseDto } from "./user-response.dto";

@ApiTags("Admin Users")
@ApiBearerAuth("bearer")
@Controller("admin/users")
@UseGuards(AdminAuthGuard)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Create a new admin user (admin only)" })
  @ApiUnauthorizedResponse({ description: "Missing or invalid bearer token" })
  @ApiCreatedResponse({
    type: UserResponseDto,
      schema: {
      example: {
        id: "ckxyz_admin_001",
        name: "María Fernanda",
        lastName: "Gómez",
        document: "98765432",
        email: "maria.gomez@example.com",
        role: "ADMIN",
        isActive: true,
        createdAt: "2026-04-27T16:20:00.000Z",
      },
    },
  })
  @Post("")
  async createAdmin(@Body() body: AdminCreateUserDto) {
    const created = await this.usersService.createUser({
      name: body.name,
      lastName: body.lastName,
      document: body.document,
      email: body.email,
      password: body.password,
      role: "ADMIN",
    });

    return {
      id: created.id,
      name: created.name,
      lastName: created.lastName ?? undefined,
      document: created.document ?? undefined,
      email: created.email,
      role: "ADMIN",
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    };
  }
}

