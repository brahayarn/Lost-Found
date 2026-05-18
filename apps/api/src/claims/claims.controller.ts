import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import {
  ClaimStatus,
  CreateClaimDto,
  CreateClaimSchema,
  UserRole,
} from "@lf/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ClaimsService } from "./claims.service";
import { Public, Roles } from "../auth/decorators";

@ApiTags("claims")
@Controller("claims")
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateClaimSchema))
  @ApiOperation({ summary: "Подати заявку на втрачену річ (публічний)" })
  async create(@Body() dto: CreateClaimDto) {
    const claim = await this.claimsService.create(dto);
    return {
      id: claim._id.toString(),
      claimNumber: claim.claimNumber,
      status: claim.status,
    };
  }

  @Get(":id")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Деталі заявки" })
  async getOne(@Param("id") id: string) {
    const claim = await this.claimsService.findById(id);
    if (!claim) throw new NotFoundException("Claim not found");
    return claim;
  }

  @Patch(":id/status")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Змінити статус заявки" })
  async setStatus(
    @Param("id") id: string,
    @Body() body: { status: ClaimStatus },
  ) {
    if (
      !body?.status ||
      !Object.values(ClaimStatus).includes(body.status)
    ) {
      throw new BadRequestException(
        `Status must be one of: ${Object.values(ClaimStatus).join(", ")}`,
      );
    }
    const claim = await this.claimsService.updateStatus(id, body.status);
    if (!claim) throw new NotFoundException("Claim not found");
    return {
      id: claim._id.toString(),
      claimNumber: claim.claimNumber,
      status: claim.status,
    };
  }

  @Post(":id/confirm-identity")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Підтвердити особу заявника (для видачі цінних речей)",
  })
  async confirmIdentity(
    @Param("id") id: string,
    @Body() body: { idDocumentUrl?: string },
  ) {
    const claim = await this.claimsService.confirmIdentity(
      id,
      body?.idDocumentUrl,
    );
    if (!claim) throw new NotFoundException("Claim not found");
    return {
      id: claim._id.toString(),
      claimNumber: claim.claimNumber,
      identityConfirmed: claim.identityConfirmed,
    };
  }

  @Post(":id/revoke-identity")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Скасувати підтвердження особи заявника",
  })
  async revokeIdentity(@Param("id") id: string) {
    const claim = await this.claimsService.revokeIdentity(id);
    if (!claim) throw new NotFoundException("Claim not found");
    return {
      id: claim._id.toString(),
      claimNumber: claim.claimNumber,
      identityConfirmed: claim.identityConfirmed,
    };
  }

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Список заявок" })
  async list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("search") search?: string,
  ) {
    return this.claimsService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
    });
  }
}
