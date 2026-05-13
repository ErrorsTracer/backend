import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

export type RequestLogContext = {
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  durationMs?: number;
  ip?: string;
  userAgent?: string;
};

@Injectable()
export class ApiLoggerService {
  private readonly logger = new Logger('Api');

  logRequest(context: RequestLogContext) {
    const message = [
      context.requestId,
      context.method,
      context.url,
      context.statusCode,
      context.durationMs !== undefined ? `${context.durationMs}ms` : undefined,
    ]
      .filter(Boolean)
      .join(' ');

    if ((context.statusCode ?? 0) >= 500) {
      this.logger.error(message);
      return;
    }

    if ((context.statusCode ?? 0) >= 400) {
      this.logger.warn(message);
      return;
    }

    this.logger.log(message);
  }

  logFailure(context: RequestLogContext, error: unknown, request?: Request) {
    const message = [
      context.requestId,
      context.method,
      context.url,
      context.statusCode,
      context.durationMs !== undefined ? `${context.durationMs}ms` : undefined,
      this.getErrorMessage(error),
    ]
      .filter(Boolean)
      .join(' ');

    const trace = error instanceof Error ? error.stack : undefined;
    if ((context.statusCode ?? 0) >= 500) {
      this.logger.error(message, trace);
    } else {
      this.logger.warn(message);
    }

    if (request?.body !== undefined) {
      this.logger.debug(
        `${context.requestId} body ${this.safeJson(request.body)}`,
      );
    }
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return typeof error === 'string' ? error : 'Unknown error';
  }

  private safeJson(value: unknown) {
    try {
      return JSON.stringify(value);
    } catch {
      return '[unserializable]';
    }
  }
}
