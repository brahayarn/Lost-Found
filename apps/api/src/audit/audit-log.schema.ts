import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "audit_logs" })
export class AuditLog {
  @Prop({ type: String, index: true })
  actorId?: string;

  @Prop({ type: String, index: true })
  actorEmail?: string;

  @Prop({ type: String, required: true, index: true })
  action!: string;

  @Prop({ type: String, required: true, index: true })
  method!: string;

  @Prop({ type: String, required: true })
  path!: string;

  @Prop({ type: Number })
  statusCode?: number;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: Object })
  payload?: unknown;

  @Prop({ type: String })
  error?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
