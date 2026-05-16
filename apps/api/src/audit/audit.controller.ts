import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { AuditService } from "./audit.service";

@ApiTags("audit")
@ApiBearerAuth("JWT")
@Controller("audit-logs")
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: "Журнал аудиту (тільки адмін)" })
  async list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "50",
    @Query("actorId") actorId?: string,
    @Query("action") action?: string,
  ) {
    return this.audit.list({
      page: Number(page),
      pageSize: Number(pageSize),
      actorId,
      action,
    });
  }
}
