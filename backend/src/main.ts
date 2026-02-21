import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { getConfig } from './config/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  const config = getConfig();

  // Enable CORS
  app.enableCors({
    origin: config.corsOrigin.split(','),
    credentials: true,
  });

  // Add validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger documentation
  if (config.enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('FEAF Dashboard API')
      .setDescription('Kubernetes-native FEAF board management system')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('Authentication')
      .addTag('Boards')
      .addTag('Reference Models')
      .addTag('Health')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    logger.log(`Swagger documentation available at /api/docs`);
  }

  // Start server
  await app.listen(config.appPort, config.appHost);

  logger.log(
    `🚀 Application started on http://${config.appHost}:${config.appPort}`,
  );
  logger.log(`📊 Environment: ${config.nodeEnv}`);
  logger.log(`🔐 JWT Expiration: ${config.jwtExpiration}`);
  logger.log(`📦 Dapr App ID: ${config.daprAppId}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error);
  process.exit(1);
});
