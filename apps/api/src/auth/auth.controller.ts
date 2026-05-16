import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Request } from "express";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LoginDto, LoginSchema } from "@lf/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";
import { CurrentUser, Public } from "./decorators";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthUser } from "./auth.types";

function clientMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"] as string | undefined,
    ip:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
      req.ip,
  };
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: "Логін за email/password → access + refresh" })
  login(
    @Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto,
    @Req() req: Request,
  ) {
    return this.auth.login(dto, clientMeta(req));
  }

  @Post("refresh")
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: "Ротувати refresh-токен → нова пара access+refresh" })
  refresh(@Body() body: { refreshToken: string }, @Req() req: Request) {
    if (!body?.refreshToken) {
      throw new BadRequestException("refreshToken is required");
    }
    return this.auth.refresh(body.refreshToken, clientMeta(req));
  }

  @Post("logout")
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: "Відкликати refresh-токен" })
  async logout(@Body() body: { refreshToken?: string }) {
    await this.auth.logout(body?.refreshToken);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Поточний користувач" })
  me(@CurrentUser() user: AuthUser) {
    return user;
  }
}
