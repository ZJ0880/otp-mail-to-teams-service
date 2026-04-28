import { Body, Controller, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UsersService } from "../../../application/users.service";
import { RegisterUserDto } from "./register-user.dto";
import { UserResponseDto } from "./user-response.dto";

@ApiTags("Public Users")
@Controller("public/users")
export class PublicUsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Register a new user" })
  @ApiCreatedResponse({
    type: UserResponseDto,
      schema: {
      example: {
        id: "ckxyz123abc",
        name: "Juan Carlos",
        lastName: "Perez",
        document: "12345678",
        email: "juan.perez@example.com",
        role: "USER",
        isActive: true,
        createdAt: "2026-04-27T16:20:00.000Z",
      },
    },
  })
  @Post("register")
  async register(@Body() body: RegisterUserDto) {
    const created = await this.usersService.createUser({
      name: body.name,
      lastName: body.lastName,
      document: body.document,
      email: body.email,
      password: body.password,
      role: "USER",
    });

    return {
      id: created.id,
      name: created.name,
      lastName: created.lastName ?? undefined,
      document: created.document ?? undefined,
      email: created.email,
      role: "USER",
      isActive: created.isActive,
      createdAt: created.createdAt.toISOString(),
    };
  }
}
