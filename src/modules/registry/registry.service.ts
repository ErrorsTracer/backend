import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Applications } from '../../database/models/applications.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { ERROR_KEYS } from '../../common/localization/error-keys';

@Injectable()
export class RegistryService {
  constructor(
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    @InjectModel(Credentials)
    private credentialsRepository: typeof Credentials,

    @InjectModel(Applications)
    private appsRepository: typeof Applications,
  ) {}

  async createReactError(data) {
    data.client = 'React';

    // check org validity
    // if (!org) throw new BadRequestException(ERROR_KEYS.ORGANIZATION_KEY_INVALID);
    // if (!org.organization?.isActive)
    //   throw new BadRequestException(ERROR_KEYS.ORGANIZATION_UNAVAILABLE);
    // if (org.organization.isSuspended)
    //   throw new BadRequestException(ERROR_KEYS.ORGANIZATION_UNAVAILABLE);
    // if (org.organization.isDeleted)
    //   throw new BadRequestException(ERROR_KEYS.ORGANIZATION_UNAVAILABLE);

    // get app by appKey
    const app = (
      await this.credentialsRepository.findOne({
        where: { appKey: data.credentials.appKey },
        include: [{ model: Applications }],
      })
    )?.toJSON();

    // check app validity
    if (!app) throw new BadRequestException(ERROR_KEYS.APP_KEY_INVALID);
    // if (!app.application?.isActive)
    //   throw new BadRequestException(ERROR_KEYS.APP_UNAVAILABLE);
    // if (app.application.isSuspended)
    //   throw new BadRequestException(ERROR_KEYS.APP_UNAVAILABLE);
    // if (app.application.isDeleted)
    //   throw new BadRequestException(ERROR_KEYS.APP_UNAVAILABLE);

    // check if app belongs to the same org

    const appBelongsToOrg = (
      await this.appsRepository.findOne({
        where: {
          id: app.application?.id,
          // organization: { id: org.organization.id },
        },
      })
    )?.toJSON();

    if (!appBelongsToOrg)
      throw new BadRequestException(ERROR_KEYS.APP_ORGANIZATION_MISMATCH);

    // check if production mode is enabled

    if (!app.isProductionEnabled)
      throw new BadRequestException(ERROR_KEYS.APP_PRODUCTION_DISABLED);

    // check if the error is occurred before
    const happenedBefore = await this.errorsRepository.findAndCountAll({
      where: { error: data.error.error },
    });

    // save error if credentials are prod
    await this.errorsRepository.create({
      error: data.error.error,
      repeated: happenedBefore.count + 1,
      stack: data.error?.stack,
      href: data.error?.href,
      host: data.error?.host,
      clientAgent: data.error?.agent,
      clientPlatform: data.error?.platform,
      applicationId: app.application?.id,
      additionalData: data?.error?.additionalData || null,
    } as any);

    return { message: 'Error registry created!' };
  }
}
