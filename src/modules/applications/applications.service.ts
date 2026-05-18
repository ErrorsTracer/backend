import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ApplicationsRepository } from './applications.repo';
import { ERROR_KEYS } from '../../common/localization/error-keys';
import {
  ApplicationMembershipRole,
  ApplicationMembershipStatus,
  ApplicationStatus,
  NotificationType,
} from '../../common/constants/app.constants';
import { TransactionManager } from '../../helpers/transaction.helper';

@Injectable()
export class ApplicationsService {
  constructor(
    private applicationsRepository: ApplicationsRepository,
    private transactionManager: TransactionManager,
  ) {}

  async getMyApps(user) {
    return await this.applicationsRepository.getUserApps(user.id);
  }

  async getAppMemberships(params, user) {
    const application = await this.applicationsRepository.getAppByIdForUser({
      applicationId: params.id,
      userId: user.id,
    });

    if (!application) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    return await this.applicationsRepository.getApplicationMemberships(
      params.id,
    );
  }

  async getFrameworks() {
    return await this.applicationsRepository.getFrameworks();
  }

  async updateProductionMode(params, user) {
    const application = await this.applicationsRepository.getAllAppInfo({
      applicationId: params.id,
      userId: user.id,
    });

    if (!application) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    const environment = await this.applicationsRepository.updateProductionMode({
      applicationId: params.id,
      isEnabled: !application.environment.isEnabled,
    });

    if (!environment) {
      throw new NotFoundException(ERROR_KEYS.CREDENTIAL_NOT_FOUND);
    }

    return { message: 'Production mode updated successfully' };
  }

  async getAppCredentials(params, user) {
    const application = await this.applicationsRepository.getAllAppInfo({
      applicationId: params.id,
      userId: user.id,
    });

    if (!application) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    if (!application.environment) {
      throw new NotFoundException(ERROR_KEYS.CREDENTIAL_NOT_FOUND);
    }

    return {
      id: application.environment.id,
      appKey: application.environment.appKey,
      isEnabled: application.environment.isEnabled,
      applicationId: application.environment.applicationId,
    };
  }

  async createApp(data, user) {
    const duplicatedApp = await this.applicationsRepository.getAppByNameForUser(
      {
        name: data.name,
        userId: user.id,
      },
    );

    if (duplicatedApp) {
      throw new BadRequestException(ERROR_KEYS.APP_ALREADY_EXISTS);
    }

    const trans = await this.transactionManager.runInTransaction(
      async (transaction) => {
        const application = await this.applicationsRepository.createApplication(
          {
            name: data.name,
            about: data.about,
            frameworkId: data.framework,
            ownerId: user.id,
          },
          transaction,
        );

        const membership =
          await this.applicationsRepository.createApplicationMembership(
            {
              applicationId: application.dataValues.id,
              userId: user.id,
              role: ApplicationMembershipRole.OWNER,
              status: ApplicationMembershipStatus.ACTIVE,
              joinedAt: new Date(),
            },
            transaction,
          );

        const environment = await this.applicationsRepository.createEnvironment(
          {
            applicationId: application.dataValues.id,
            envName: data.envName,
            isEnabled: false,
          },
          transaction,
        );

        return { ...application.toJSON(), membership, environment };
      },
    );

    return await this.applicationsRepository.getAppByIdForUser({
      applicationId: trans.id,
      userId: user.id,
    });
  }

  async invitePeople(data: { emails: string[] }, params, user) {
    const application = await this.applicationsRepository.getAllAppInfo({
      applicationId: params.id,
      userId: user.id,
    });

    if (!application) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    const ownerMembership =
      await this.applicationsRepository.getOwnerMembershipForApp({
        applicationId: params.id,
        userId: user.id,
      });

    if (!ownerMembership) {
      throw new ForbiddenException(ERROR_KEYS.APP_INVITE_FORBIDDEN);
    }

    const emails = [
      ...new Set(
        data.emails.map((email: string) => email.toLowerCase().trim()),
      ),
    ];

    const result = await this.transactionManager.runInTransaction(
      async (transaction) => {
        for (const email of emails) {
          let invitedUser =
            await this.applicationsRepository.getUserByEmail(email);

          if (!invitedUser) {
            invitedUser = await this.applicationsRepository.createUserByEmail(
              email,
              transaction,
            );
          }

          await this.applicationsRepository.getMembershipByAppAndUser(
            params.id,
            invitedUser.dataValues.id,
          );

          await this.applicationsRepository.createApplicationMembership(
            {
              applicationId: params.id,
              userId: invitedUser.dataValues.id,
              role: ApplicationMembershipRole.MEMBER,
              status: ApplicationMembershipStatus.INVITED,
              joinedAt: null,
              invitedBy: user.id,
            },
            transaction,
          );

          await this.applicationsRepository.createNotification(
            {
              applicationId: params.id,
              userId: invitedUser.dataValues.id,
              type: NotificationType.APPLICATION_INVITE,
              message: `You have been invited to ${application.dataValues.name}.`,
            },
            transaction,
          );
        }

        return { message: 'Invitation process completed' };
      },
    );

    return result;
  }

  async deleteApp(params, user) {
    const application = await this.applicationsRepository.getAppByIdForUser({
      applicationId: params.id,
      userId: user.id,
    });

    if (!application) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    const ownerMembership =
      await this.applicationsRepository.getOwnerMembershipForApp({
        applicationId: params.id,
        userId: user.id,
      });

    if (!ownerMembership) {
      throw new ForbiddenException(ERROR_KEYS.APP_DELETE_FORBIDDEN);
    }

    await this.transactionManager.runInTransaction(async (transaction) => {
      await this.applicationsRepository.deleteCredentialsByApplicationId(
        params.id,
        transaction,
      );
      await this.applicationsRepository.deleteMembershipsByApplicationId(
        params.id,
        transaction,
      );
      await this.applicationsRepository.deleteErrorsByApplicationId(
        params.id,
        transaction,
      );
      await this.applicationsRepository.deleteApplication(
        params.id,
        transaction,
      );
    });

    return { message: 'Application deleted successfully' };
  }

  async activateApp(params, user) {
    await this.updateAppStatus(params, user, ApplicationStatus.ACTIVE);
    return { message: 'Application activated successfully' };
  }

  async suspendApp(params, user) {
    await this.updateAppStatus(params, user, ApplicationStatus.SUSPENDED);

    return { message: 'Application suspended successfully' };
  }

  async getAppInfo(params, user) {
    const application = await this.applicationsRepository.getAppByIdForUser({
      applicationId: params.id,
      userId: user.id,
    });

    if (!application) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    return application;
  }

  private async updateAppStatus(params, user, status: ApplicationStatus) {
    const application = await this.applicationsRepository.getAllAppInfo({
      applicationId: params.id,
      userId: user.id,
    });

    if (!application) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    const ownerMembership =
      await this.applicationsRepository.getOwnerMembershipForApp({
        applicationId: params.id,
        userId: user.id,
      });

    if (!ownerMembership) {
      throw new ForbiddenException(ERROR_KEYS.APP_STATUS_FORBIDDEN);
    }

    const updatedApplication =
      await this.applicationsRepository.updateApplicationStatus({
        applicationId: params.id,
        status,
      });

    if (!updatedApplication) {
      throw new NotFoundException(ERROR_KEYS.APP_NOT_FOUND);
    }

    return updatedApplication;
  }
}
