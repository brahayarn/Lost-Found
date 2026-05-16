import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AuditLog, AuditLogDocument } from "./audit-log.schema";

export interface AuditEntry {
  actorId?: string;
  actorEmail?: string;
  action: string;
  method: string;
  path: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  payload?: unknown;
  error?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectModel(AuditLog.name)
    private readonly model: Model<AuditLogDocument>,
  ) {}

  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.model.create(entry);
    } catch (err) {
      this.logger.warn(`Failed to write audit log: ${(err as Error).message}`);
    }
  }

  async list(params: {
    page?: number;
    pageSize?: number;
    actorId?: string;
    action?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
    const filter: Record<string, unknown> = {};
    if (params.actorId) filter.actorId = params.actorId;
    if (params.action) filter.action = params.action;

    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, pageSize };
  }
}
