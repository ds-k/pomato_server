import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';

  console.log(`Current environment: ${process.env.NODE_ENV}`);

  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
