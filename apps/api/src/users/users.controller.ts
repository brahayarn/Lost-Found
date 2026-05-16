import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { z } from "zod";
import { UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { UsersService } from "./users.service";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  password: z.string().min(6).max(100),
  role: z.nativeEnum(UserRole),
});
const UpdateRoleSchema = z.object({ role: z.nativeEnum(UserRole) });

@ApiTags("users")
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Список користувачів" })
  list() {
    return this.users.list();
  }

  @Post()
  @ApiOperation({ summary: "Створити користувача" })
  create(@Body(new ZodValidationPipe(CreateUserSchema)) dto: any) {
    return this.users.create(dto);
  }

  @Patch(":id/role")
  @ApiOperation({ summary: "Змінити роль" })
  setRole(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateRoleSchema)) dto: { role: UserRole },
  ) {
    return this.users.setRole(id, dto.role);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Видалити користувача" })
  remove(@Param("id") id: string) {
    return this.users.remove(id);
  }
}
