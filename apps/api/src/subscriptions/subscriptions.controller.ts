import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ItemCategory, UserRole } from "@lf/shared";
import { Public, Roles } from "../auth/decorators";
import { SubscriptionsService } from "./subscriptions.service";

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Підписка гостя на сповіщення про знахідки (категорія + ключові слова)",
  })
  async create(
    @Body() body: { email: string; category: string; keywords?: string[] },
  ) {
    if (!body?.email || !/^\S+@\S+\.\S+$/.test(body.email)) {
      throw new BadRequestException("Invalid email");
    }
    if (
      !body?.category ||
      !Object.values(ItemCategory).includes(body.category as ItemCategory)
    ) {
      throw new BadRequestException(
        `Category must be one of: ${Object.values(ItemCategory).join(", ")}`,
      );
    }
    const sub = await this.service.create({
      email: body.email,
      category: body.category as ItemCategory,
      keywords: body.keywords,
    });
    return {
      id: sub._id.toString(),
      email: sub.email,
      category: sub.category,
      keywords: sub.keywords,
    };
  }

  @Get()
  @ApiBearerAuth("JWT")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Список активних підписок" })
  async list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "50",
    @Query("search") search?: string,
  ) {
    return this.service.list({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
    });
  }

  @Delete(":id")
  @ApiBearerAuth("JWT")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Деактивувати підписку" })
  async deactivate(@Param("id") id: string) {
    const sub = await this.service.deactivate(id);
    if (!sub) throw new NotFoundException("Subscription not found");
    return { id: sub._id.toString(), active: sub.active };
  }
}
