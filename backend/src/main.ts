import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.enableCors({
    origin: (config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  });
  await app.listen(Number(config.get('PORT') ?? 3000));
}

bootstrap();
