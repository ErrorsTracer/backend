import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LocalizationService } from '../localization/localization.service';
import { SupportedLocale } from '../localization/locales';

@Catch(HttpException)
export class LocalizedHttpExceptionFilter implements ExceptionFilter {
  constructor(private localizationService: LocalizationService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus?.() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception.getResponse();
    const locale = this.localizationService.getLocaleFromRequest(request);

    response.status(status).json(
      this.localizeResponse(exceptionResponse, exception.message, locale, {
        statusCode: status,
        path: request.url,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  private localizeResponse(
    exceptionResponse: string | object,
    fallbackMessage: string,
    locale: SupportedLocale,
    meta: { statusCode: number; path: string; timestamp: string },
  ) {
    if (typeof exceptionResponse === 'string') {
      return {
        ...meta,
        message: this.translateMessage(exceptionResponse, locale),
      };
    }

    const body = exceptionResponse as Record<string, unknown>;
    const message = body.message ?? fallbackMessage;

    return {
      ...body,
      ...meta,
      message: Array.isArray(message)
        ? message.map((item) => this.translateMessage(item, locale))
        : this.translateMessage(message, locale),
    };
  }

  private translateMessage(message: unknown, locale: SupportedLocale) {
    if (!this.localizationService.isTranslationKey(message)) {
      return message;
    }

    return this.localizationService.translate(message, locale);
  }
}
