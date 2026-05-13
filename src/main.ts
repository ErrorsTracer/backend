import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import * as dotenv from 'dotenv';
import { ValidationError } from 'class-validator';

import cookieParser from 'cookie-parser';
import { LocalizedHttpExceptionFilter } from './common/filters/localized-http-exception.filter';
import { LocalizationService } from './common/localization/localization.service';
import { ERROR_KEYS } from './common/localization/error-keys';

async function bootstrap() {
  // configure environment variables

  dotenv.config();

  // create the app
  const app = await NestFactory.create(AppModule);

  // use cookie parser middleware
  app.use(cookieParser());

  // enable cors
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
  });

  // initialize global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          message: ERROR_KEYS.VALIDATION_FAILED,
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints,
          })),
        }),
    }),
  );
  app.useGlobalFilters(
    new LocalizedHttpExceptionFilter(new LocalizationService()),
  );

  // enable api versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [VERSION_NEUTRAL, '0.1'],
  });

  // start listening on port 4973
  await app.listen(process.env.APP_PORT ?? 4973);
}

void bootstrap();
