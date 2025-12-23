import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port, process.env.HOST || '0.0.0.0');

  logger.log(`🎡 Spin The Wheel Backend is running on port ${port}`);
  logger.log(`📡 WebSocket server is ready at /events namespace`);
  logger.log(`🔗 Blockchain: Chain ID ${process.env.CHAIN_ID}`);
  logger.log(`📝 Contract: ${process.env.CONTRACT_ADDRESS}`);
}

bootstrap();
