import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // API 前缀
  app.setGlobalPrefix('api');

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('Star Rail Replication Plan API')
    .setDescription('星穹铁道剧情复现计划 - REST API 文档')
    .setVersion('1.0')
    .addTag('auth', '认证模块')
    .addTag('sessions', '会话管理')
    .addTag('story', '剧情推进')
    .addTag('snapshots', '快照管理')
    .addTag('characters', '人物管理')
    .addTag('scenes', '场景管理')
    .addTag('anchors', '锚点管理')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 API Server running on http://localhost:${port}/api`);
  console.log(
    `📚 API Documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
