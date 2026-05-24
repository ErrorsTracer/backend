import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Applications } from '../../database/models/applications.model';
import { Environments } from '../../database/models/environments.model';
import { Errors } from '../../database/models/errors.model';
import { ERROR_KEYS } from '../../common/localization/error-keys';
import { IngestErrorDto } from './errors.dto';
import { generateErrorFingerprint, sanitizeValue } from './errors.utils';

@Injectable()
export class ErrorsService {
  constructor(
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    @InjectModel(Environments)
    private environmentsRepository: typeof Environments,
  ) {}

  async ingestError(data: IngestErrorDto, ingestionKey?: string) {
    if (!ingestionKey) {
      throw new UnauthorizedException(ERROR_KEYS.AUTH_REQUIRED);
    }

    const credential = await this.environmentsRepository.findOne({
      where: { appKey: ingestionKey },
      include: [{ model: Applications }],
    });

    if (!credential) {
      throw new UnauthorizedException(ERROR_KEYS.APP_KEY_INVALID);
    }

    const applicationId = credential.applicationId;

    if (data.projectId && data.projectId !== applicationId) {
      throw new ForbiddenException(ERROR_KEYS.APP_ORGANIZATION_MISMATCH);
    }

    if (!credential.isEnabled) {
      throw new BadRequestException(ERROR_KEYS.APP_PRODUCTION_DISABLED);
    }

    const message = data.message ?? data.error;

    if (!message) {
      throw new BadRequestException(ERROR_KEYS.VALIDATION_FAILED);
    }

    const environment = data.environment ?? 'production';
    const level = data.level ?? 'error';
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const fingerprint =
      data.fingerprint ??
      generateErrorFingerprint(
        { ...data, message },
        applicationId,
        environment,
      );

    const event = await this.errorsRepository.create({
      applicationId,
      error: message,
      stack: data.stack ?? null,
      environment,
      framework: data.framework ?? null,
      language: data.language ?? null,
      runtime: data.runtime ?? null,
      level,
      name: data.name ?? null,
      fingerprint,
      handled: data.handled ?? null,
      timestamp,
      release: data.release ?? null,
      url: data.url ?? null,
      transaction: data.transaction ?? null,
      user: sanitizeValue(data.user) as Record<string, unknown> | null,
      request: sanitizeValue(data.request) as Record<string, unknown> | null,
      tags: sanitizeValue(data.tags) as Record<string, unknown> | null,
      extra: sanitizeValue({
        ...(data.extra ?? {}),
        ...(data.serverName ? { serverName: data.serverName } : {}),
      }) as Record<string, unknown>,
      breadcrumbs: sanitizeValue(data.breadcrumbs) as
        | Record<string, unknown>[]
        | null,
      contexts: sanitizeValue(data.contexts) as Record<string, unknown> | null,
      href: data.url ?? null,
      client: data.framework ?? null,
      additionalData: null,
    } as any);

    return {
      id: event.id,
      status: 'accepted',
    };
  }
}
