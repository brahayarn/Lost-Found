import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UsePipes,
} from "@nestjs/common";
import type { Response } from "express";
import * as ExcelJS from "exceljs";
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import {
  CreateItemDto,
  CreateItemSchema,
  HandoverDto,
  HandoverDtoSchema,
  UserRole,
} from "@lf/shared";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { ItemsService } from "./items.service";
import { PdfService } from "../pdf/pdf.service";
import { HandoverActsService } from "../handover-acts/handover-acts.service";
import { CurrentUser, Public, Roles } from "../auth/decorators";
import type { AuthUser } from "../auth/auth.types";

@ApiTags("items")
@Controller("items")
export class ItemsController {
  private readonly logger = new Logger(ItemsController.name);

  constructor(
    private readonly itemsService: ItemsService,
    private readonly pdfService: PdfService,
    private readonly handoverService: HandoverActsService,
  ) {}

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CreateItemSchema))
  @ApiOperation({ summary: "Створити нову знахідку" })
  @ApiResponse({ status: 201, description: "Знахідку створено" })
  @ApiResponse({ status: 400, description: "Помилка валідації" })
  async create(@Body() dto: CreateItemDto) {
    const item = await this.itemsService.create(dto);
    this.logger.log(`Created item ${item.itemNumber} (${item.trackingCode})`);
    return {
      id: item._id.toString(),
      itemNumber: item.itemNumber,
      trackingCode: item.trackingCode,
      status: item.status,
      title: item.title,
      createdAt: item.get("createdAt"),
    };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: "Список знахідок (публічний)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "sortField", required: false, type: String })
  @ApiQuery({ name: "sortDesc", required: false, type: Boolean })
  async list(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("search") search?: string,
    @Query("sortField") sortField?: string,
    @Query("sortDesc") sortDesc?: string,
  ) {
    return this.itemsService.listPublic({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      sortField,
      sortDesc: sortDesc === "true",
    });
  }

  @Get("admin")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Список знахідок (адмін, без розмиття + з фільтром по статусу)" })
  async listAdmin(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "20",
    @Query("search") search?: string,
    @Query("sortField") sortField?: string,
    @Query("sortDesc") sortDesc?: string,
    @Query("status") status?: string,
  ) {
    return this.itemsService.list({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      sortField,
      sortDesc: sortDesc === "true",
      status,
    });
  }

  @Get("export.csv")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "CSV-експорт знахідок" })
  async exportCsv(
    @Res({ passthrough: true }) res: Response,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ) {
    const all = await this.itemsService.list({
      page: 1,
      pageSize: 10000,
      status,
      search,
    });
    const headers = [
      "itemNumber",
      "title",
      "category",
      "status",
      "address",
      "foundAt",
      "isValuable",
      "createdAt",
    ];
    const escape = (v: any) => {
      if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    };
    const rows = all.data.map((i: any) =>
      [
        i.itemNumber,
        i.title,
        i.category,
        i.status,
        i.foundLocation?.address ?? "",
        i.foundAt ? new Date(i.foundAt).toISOString() : "",
        i.isValuable ? "yes" : "no",
        i.createdAt ? new Date(i.createdAt).toISOString() : "",
      ]
        .map(escape)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="items-${Date.now()}.csv"`,
    );
    return "﻿" + csv;
  }

  @Get("export.xlsx")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "XLSX-експорт знахідок" })
  async exportXlsx(
    @Res() res: Response,
    @Query("status") status?: string,
    @Query("search") search?: string,
  ): Promise<void> {
    const all = await this.itemsService.list({
      page: 1,
      pageSize: 10000,
      status,
      search,
    });

    const wb = new ExcelJS.Workbook();
    wb.creator = "Lost & Found";
    wb.created = new Date();
    const ws = wb.addWorksheet("Знахідки");
    ws.columns = [
      { header: "№ знахідки", key: "itemNumber", width: 18 },
      { header: "Назва", key: "title", width: 35 },
      { header: "Категорія", key: "category", width: 14 },
      { header: "Статус", key: "status", width: 14 },
      { header: "Локація", key: "address", width: 35 },
      { header: "Знайдено", key: "foundAt", width: 18 },
      { header: "Цінна", key: "isValuable", width: 8 },
      { header: "Колір", key: "color", width: 12 },
      { header: "Бренд", key: "brand", width: 15 },
      { header: "Теги", key: "tags", width: 25 },
      { header: "Зберігати до", key: "retentionDate", width: 18 },
      { header: "Створено", key: "createdAt", width: 18 },
    ];
    ws.getRow(1).font = { bold: true };

    for (const i of all.data as Array<Record<string, unknown> & {
      foundLocation?: { address?: string };
      isValuable?: boolean;
      tags?: string[];
      foundAt?: Date | string;
      retentionDate?: Date | string;
      createdAt?: Date | string;
    }>) {
      ws.addRow({
        itemNumber: i.itemNumber,
        title: i.title,
        category: i.category,
        status: i.status,
        address: i.foundLocation?.address ?? "",
        foundAt: i.foundAt ? new Date(i.foundAt) : null,
        isValuable: i.isValuable ? "так" : "ні",
        color: i.color ?? "",
        brand: i.brand ?? "",
        tags: (i.tags ?? []).join(", "),
        retentionDate: i.retentionDate ? new Date(i.retentionDate) : null,
        createdAt: i.createdAt ? new Date(i.createdAt) : null,
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="items-${Date.now()}.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  }

  @Get(":id")
  @Public()
  @ApiOperation({ summary: "Отримати знахідку за ID (публічний, blurred)" })
  async getOne(@Param("id") id: string) {
    const item = await this.itemsService.findByIdPublic(id);
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  @Get(":id/full")
  @Roles(UserRole.OPERATOR, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: "Повні дані знахідки (з оригіналами фото та прикметами)" })
  async getOneFull(@Param("id") id: string) {
    const item = await this.itemsService.findById(id);
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  @Post(":id/verify")
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Підтвердити верифікацію цінної речі (VERIFICATION → PUBLISHED)",
  })
  async verify(
    @Param("id") id: string,
    @Body() body: { verificationNotes?: string },
    @CurrentUser() user: AuthUser,
  ) {
    const item = await this.itemsService.verify(id, {
      verificationNotes: body?.verificationNotes,
      verifiedBy: user.name ?? user.email,
    });
    if (!item) {
      throw new NotFoundException(
        "Item not found or not in VERIFICATION status",
      );
    }
    return {
      id: item._id.toString(),
      itemNumber: item.itemNumber,
      status: item.status,
      verifiedBy: item.verifiedBy,
      verifiedAt: item.verifiedAt,
    };
  }

  @Post(":id/handover")
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Видача речі (акт + цифровий підпис)" })
  async handover(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(HandoverDtoSchema)) dto: HandoverDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.handoverService.handover(id, {
      ...dto,
      operatorName: dto.operatorName ?? user.name,
    });
  }

  @Post("dispose")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Масова утилізація (поліція / благодійність / знищити)" })
  async dispose(
    @Body()
    body: { ids: string[]; action: "POLICE" | "CHARITY" | "DESTROY" },
  ) {
    return this.itemsService.bulkDispose(body.ids, body.action);
  }

  @Get(":id/label")
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: "PDF-етикетка 60×40 мм з QR" })
  async label(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const item = await this.itemsService.findById(id);
    if (!item) throw new NotFoundException("Item not found");

    const webBase = process.env.WEB_ORIGIN ?? "http://localhost:3001";
    const publicUrl = `${webBase}/items/${item._id.toString()}`;

    const pdf = await this.pdfService.generateItemLabel({
      itemNumber: item.itemNumber,
      category: item.category,
      trackingCode: item.trackingCode,
      publicUrl,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${item.itemNumber}.pdf"`,
    );
    return new StreamableFile(pdf);
  }
}
