import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap, catchError, throwError } from "rxjs";
import type { Request, Response } from "express";
import { AuditService } from "./audit.service";

const MUTATING = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function sanitize(body: unknown): unknown {
  if (!body || typeof body !== "object") return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const k of Object.keys(clone)) {
    if (/password|secret|token|signature/i.test(k)) clone[k] = "[redacted]";
  }
  return clone;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = ctx.switchToHttp();
    const req = http.getRequest<Request & { user?: { id: string; email: string } }>();
    const res = http.getResponse<Response>();

    if (!MUTATING.has(req.method)) return next.handle();
    // Не логуємо завантаження файлів і логін (тіло містить пароль)
    if (req.path.startsWith("/uploads") || req.path.endsWith("/auth/login")) {
      return next.handle();
    }

    const baseEntry = {
      actorId: req.user?.id,
      actorEmail: req.user?.email,
      action: `${req.method} ${req.route?.path ?? req.path}`,
      method: req.method,
      path: req.originalUrl ?? req.url,
      ip:
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ??
        req.ip,
      userAgent: req.headers["user-agent"],
      payload: sanitize(req.body),
    };

    return next.handle().pipe(
      tap(() => {
        void this.audit.log({ ...baseEntry, statusCode: res.statusCode });
      }),
      catchError((err) => {
        void this.audit.log({
          ...baseEntry,
          statusCode: err?.status ?? 500,
          error: err?.message ?? String(err),
        });
        return throwError(() => err);
      }),
    );
  }
}
