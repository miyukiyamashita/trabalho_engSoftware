import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { criarValidationPipe } from './common/validacao';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.useGlobalPipes(criarValidationPipe());
  app.enableCors({
    origin: (config.get<string>('FRONTEND_URL') ?? 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  });
  await app.listen(Number(config.get('PORT') ?? 3000));
}

bootstrap();
