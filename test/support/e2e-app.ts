import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
  VERSION_NEUTRAL,
  VersioningType,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ValidationError } from 'class-validator';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';
import { LocalizedHttpExceptionFilter } from '../../src/common/filters/localized-http-exception.filter';
import { ERROR_KEYS } from '../../src/common/localization/error-keys';
import { LocalizationService } from '../../src/common/localization/localization.service';

export type E2eAppContext = {
  app: INestApplication;
  httpServer: any;
};

export async function createE2eApp(): Promise<E2eAppContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.use(cookieParser());
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
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: [VERSION_NEUTRAL, '0.1'],
  });

  await app.init();

  return {
    app,
    httpServer: app.getHttpServer(),
  };
}
