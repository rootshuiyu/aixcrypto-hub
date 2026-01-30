import * as dotenv from 'dotenv';
import * as path from 'path';

// 修正加载路径：.env 在 src 的上一级目录 (server/.env)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // 環境檢測
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3002',
  ];

  /*
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false, 
    crossOriginEmbedderPolicy: false,
  }));
  */

  // CORS 配置
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token', 'X-Requested-With'],
  });

  // Swagger 文檔 - 僅在非生產環境啟用
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Superoctop Arena API')
      .setDescription('The Prediction Market Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
    logger.log('Swagger documentation available at: /api');
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  logger.log(`🚀 Backend server is running on: http://localhost:${port}`);
  logger.log(`📊 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  
  if (isProduction) {
    logger.log(`🔒 CORS restricted to: ${allowedOrigins.join(', ')}`);
  }
}
bootstrap();
