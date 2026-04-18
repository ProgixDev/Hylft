import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

function parseCorsOrigins(raw: string | undefined): string[] | boolean {
  const entries = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  // Empty → reflect request origin (dev convenience). In prod, set CORS_ORIGINS.
  return entries.length > 0 ? entries : true;
}

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: parseCorsOrigins(config.get<string>('CORS_ORIGINS')),
    credentials: true,
  });

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port, '0.0.0.0');
}
bootstrap();
