import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import * as dotenv from 'dotenv';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  // configure environment variables

  dotenv.config();

  // create the app
  const app = await NestFactory.create(AppModule);

  // use cookie parser middleware
  app.use(cookieParser());

  // enable cors
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    withCredentials: true,
  });

  // initialize global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // enable api versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [VERSION_NEUTRAL, '0.1'],
  });

  // start listening on port 4973
  await app.listen(process.env.APP_PORT ?? 4973);
}
bootstrap();
