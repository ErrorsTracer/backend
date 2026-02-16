import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Applications } from '../../database/models/applications.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { Organizations } from '../../database/models/organizations.model';

@Injectable()
export class RegistryService {
  constructor(
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    @InjectModel(Credentials)
    private credentialsRepository: typeof Credentials,
    @InjectModel(Organizations)
    private orgsRepository: typeof Organizations,
    @InjectModel(Applications)
    private appsRepository: typeof Applications,
  ) {}

  async createReactError(data) {
    data.client = 'React';

    // get organization by orgKey
    const org = (
      await this.credentialsRepository.findOne({
        where: { appKey: data.credentials.orgKey },
        include: [{ model: Applications }],
      })
    )?.toJSON();

    // check org validity
    // if (!org) return { message: 'Organization key is invalid!' };
    // if (!org.organization?.isActive)
    //   return {
    //     message: 'Organization associated with this key is not available!',
    //   };
    // if (org.organization.isSuspended)
    //   return {
    //     message: 'Organization associated with this key is not available!',
    //   };
    // if (org.organization.isDeleted)
    //   return {
    //     message: 'Organization associated with this key is not available!',
    //   };

    // get app by appKey
    const app = (
      await this.credentialsRepository.findOne({
        where: { appKey: data.credentials.appKey },
        include: [{ model: Applications }],
      })
    )?.toJSON();

    // check app validity
    if (!app) return { message: 'Application key is invalid!' };
    if (!app.application?.isActive)
      return {
        message: 'Application associated with this key is not available!',
      };
    if (app.application.isSuspended)
      return {
        message: 'Application associated with this key is not available!',
      };
    if (app.application.isDeleted)
      return {
        message: 'Application associated with this key is not available!',
      };

    // check if app belongs to the same org

    const appBelongsToOrg = (
      await this.appsRepository.findOne({
        where: {
          id: app.application.id,
          // organization: { id: org.organization.id },
        },
        include: [{ model: Applications }],
      })
    )?.toJSON();

    if (!appBelongsToOrg)
      return {
        message:
          'Make sure the application is belongs to the same organization!',
      };

    // check if the credentials are dev or prod

    if (app.env === 'DEVELOPMENT')
      return { message: 'You are using development credentials!' };

    // check if the error is occurred before
    const happenedBefore = await this.errorsRepository.findAndCountAll({
      where: { error: data.error.error },
    });

    // save error if credentials are prod
    await this.errorsRepository.create({
      error: data.error.error,
      repeated: happenedBefore[1] + 1,
      stack: data.error?.stack,
      href: data.error?.href,
      host: data.error?.host,
      clientAgent: data.error?.agent,
      clientPlatform: data.error?.platform,
      application: app.application.id,
      additionalData: data?.error?.additionalData || null,
    } as any);

    return { message: 'Error registry created!' };
  }
}
