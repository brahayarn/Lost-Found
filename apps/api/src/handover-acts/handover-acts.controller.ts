import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { HandoverActsService } from "./handover-acts.service";

@ApiTags("handover-acts")
@ApiBearerAuth("JWT")
@Controller("handover-acts")
export class HandoverActsController {
  constructor(private readonly service: HandoverActsService) {}

  @Get()
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Архів актів видачі" })
  async list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("search") search?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.service.list({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      from,
      to,
    });
  }

  @Get(":id")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Акт видачі за ID" })
  async getOne(@Param("id") id: string) {
    const act = await this.service.findById(id);
    if (!act) throw new NotFoundException("Handover act not found");
    return act;
  }
}
