import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigin =
    process.env.CORS_ORIGIN ?? 'http://localhost:5173';

  app.enableCors({
    origin: corsOrigin.split(',').map((value) => value.trim()),
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 4000;
  const server = await app.listen(port);

  // Scraping waits for the Docker job to finish; keep the HTTP socket open.
  const requestTimeoutMs = Number(
    process.env.HTTP_REQUEST_TIMEOUT_MS ?? '300000',
  );
  server.setTimeout(requestTimeoutMs);
}

await bootstrap();
