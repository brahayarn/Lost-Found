import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { UserRole } from "@lf/shared";
import { Roles } from "../auth/decorators";
import { RetentionService } from "./retention.service";
import { EmailService } from "../email/email.service";

@ApiTags("retention")
@ApiBearerAuth("JWT")
@Controller("retention")
export class RetentionController {
  constructor(
    private readonly service: RetentionService,
    private readonly email: EmailService,
  ) {}

  @Post("sweep")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      "Запустити перевірку термінів зберігання вручну (для тесту/демо). Створює warning + expired email-задачі.",
  })
  async sweepNow() {
    return this.service.runSweep();
  }

  @Post("test-email")
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Відправити тестовий лист (DEV: тільки лог; PROD: реальний email)",
  })
  async testEmail(@Body() body: { to: string }) {
    const to = body?.to ?? "test@example.com";
    await this.email.send({
      to,
      subject: "Lost & Found — тестовий лист",
      html: `<p>Це тестове повідомлення з платформи Lost &amp; Found.</p>
             <p>Час: <strong>${new Date().toISOString()}</strong></p>
             <p>Якщо ти бачиш цей лист в інбоксі — Resend налаштований правильно.</p>`,
      text: `Тестовий лист від Lost & Found, ${new Date().toISOString()}`,
    });
    return { ok: true, to, mode: process.env.RESEND_API_KEY ? "RESEND" : "DEV-LOG" };
  }
}
