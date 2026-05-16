import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Put,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { NotificationTemplatesService } from "./notification-templates.service";

@ApiTags("notification-templates")
@ApiBearerAuth("JWT")
@Controller("notification-templates")
export class NotificationTemplatesController {
  constructor(private readonly service: NotificationTemplatesService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Список шаблонів сповіщень" })
  async list() {
    return this.service.list();
  }

  @Get(":key")
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Шаблон за ключем" })
  async getOne(@Param("key") key: string) {
    const t = await this.service.findByKey(key);
    if (!t) throw new NotFoundException("Template not found");
    return t;
  }

  @Put(":key")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Оновити шаблон" })
  async update(
    @Param("key") key: string,
    @Body() body: { subject?: string; html?: string; text?: string },
  ) {
    const t = await this.service.upsert(key, body);
    if (!t) throw new NotFoundException("Template not found");
    return t;
  }
}
