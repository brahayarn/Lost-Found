import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MatchProposalStatus, UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { MatchProposalsService } from "./match-proposals.service";

@ApiTags("matches")
@ApiBearerAuth()
@Controller("matches")
export class MatchProposalsController {
  constructor(private readonly service: MatchProposalsService) {}

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Пропозиції збігів" })
  list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("status") status?: string,
  ) {
    return this.service.list({
      page: Number(page),
      pageSize: Number(pageSize),
      status,
    });
  }

  @Get(":id")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Деталі збігу" })
  async findOne(@Param("id") id: string) {
    const m = await this.service.findOne(id);
    if (!m) throw new NotFoundException("Match not found");
    return m;
  }

  @Post(":id/confirm")
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: "Підтвердити збіг (готова до видачі)" })
  async confirm(@Param("id") id: string) {
    const m = await this.service.setStatus(id, MatchProposalStatus.CONFIRMED);
    if (!m) throw new NotFoundException("Match not found");
    return { id: m._id.toString(), status: m.status };
  }

  @Post(":id/reject")
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @HttpCode(200)
  @ApiOperation({ summary: "Відхилити збіг" })
  async reject(@Param("id") id: string) {
    const m = await this.service.setStatus(id, MatchProposalStatus.REJECTED);
    if (!m) throw new NotFoundException("Match not found");
    return { id: m._id.toString(), status: m.status };
  }
}
