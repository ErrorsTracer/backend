import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Applications } from '../../database/models/applications.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { ERROR_KEYS } from '../../common/localization/error-keys';
import { IngestErrorDto } from './registry.dto';
import { generateErrorFingerprint, sanitizeValue } from './registry.utils';

@Injectable()
export class RegistryService {
  constructor(
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    @InjectModel(Credentials)
    private credentialsRepository: typeof Credentials,
  ) {}

  async ingestError(data: IngestErrorDto, ingestionKey?: string) {
    if (!ingestionKey) {
      throw new UnauthorizedException(ERROR_KEYS.AUTH_REQUIRED);
    }

    const credential = await this.credentialsRepository.findOne({
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

    if (!credential.isProductionEnabled) {
      throw new BadRequestException(ERROR_KEYS.APP_PRODUCTION_DISABLED);
    }

    const environment = data.environment ?? 'production';
    const level = data.level ?? 'error';
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
    const fingerprint =
      data.fingerprint ??
      generateErrorFingerprint(data, applicationId, environment);

    const event = await this.errorsRepository.create({
      applicationId,
      error: data.message,
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
