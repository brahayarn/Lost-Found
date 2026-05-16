import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ItemCategory, UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { RetentionPolicyService } from "./retention-policy.service";

@ApiTags("retention-policies")
@ApiBearerAuth("JWT")
@Controller("retention-policies")
export class RetentionPolicyController {
  constructor(private readonly service: RetentionPolicyService) {}

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Перелік термінів зберігання за категоріями" })
  async list() {
    return this.service.list();
  }

  @Put(":category")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Оновити термін зберігання для категорії" })
  async upsert(
    @Param("category") category: string,
    @Body() body: { days: number },
  ) {
    if (!Object.values(ItemCategory).includes(category as ItemCategory)) {
      throw new BadRequestException(`Unknown category: ${category}`);
    }
    const days = Number(body?.days);
    if (!Number.isFinite(days) || days < 1 || days > 3650) {
      throw new BadRequestException("days must be 1..3650");
    }
    return this.service.upsert(category as ItemCategory, days);
  }
}
