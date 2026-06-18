import * as dotenv from "dotenv";
import { resolve } from "path";

// Carrega .env com path absoluto ANTES de qualquer outro import
const envResult = dotenv.config({ path: resolve(process.cwd(), ".env") });
console.log(
  "[main] dotenv carregado:",
  envResult.error ? "ERRO: " + envResult.error : "OK",
);
console.log(
  "[main] JWT_SECRET:",
  process.env.JWT_SECRET
    ? `"${process.env.JWT_SECRET.substring(0, 10)}..." ✓`
    : "NÃO DEFINIDO ✗",
);
console.log(
  "[main] DATABASE_URL:",
  process.env.DATABASE_URL ? "definido ✓" : "NÃO DEFINIDO ✗",
);

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { join } from "path";
import * as express from "express";
import { AuthService } from "./auth/auth.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization,Accept",
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use("/uploads", express.static(join(process.cwd(), "uploads")));

  const authService = app.get(AuthService);
  await authService.createAdminIfNotExists();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend: http://localhost:${port}`);
}
bootstrap();
