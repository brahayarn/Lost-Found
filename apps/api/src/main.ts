import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug"],
    bodyParser: true,
  });
  // signatures (base64) можуть бути ~50-150kb
  const { json, urlencoded } = await import("express");
  app.use(json({ limit: "5mb" }));
  app.use(urlencoded({ extended: true, limit: "5mb" }));

  app.enableCors({
    origin: [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      process.env.WEB_ORIGIN ?? "http://localhost:3001",
    ],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  app.setGlobalPrefix("api/v1", { exclude: ["api/docs", "uploads/(.*)"] });

  const config = new DocumentBuilder()
    .setTitle("Lost & Found API")
    .setDescription("Платформа обліку загублених речей")
    .setVersion("1.0")
    .addBearerAuth(
      { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      "JWT",
    )
    .addTag("items")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API on http://localhost:${port}`, "Bootstrap");
  Logger.log(`Swagger on http://localhost:${port}/api/docs`, "Bootstrap");
}

bootstrap();
