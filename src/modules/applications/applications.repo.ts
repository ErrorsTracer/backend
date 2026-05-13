import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { literal, Transaction } from 'sequelize';
import { ApplicationMembership } from '../../database/models/application-membership.model';
import { ApplicationTypes } from '../../database/models/application-types.model';
import { Applications } from '../../database/models/applications.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { Notifications } from '../../database/models/notifications.model';

import { Users } from '../../database/models/users.model';
import {
  ApplicationMembershipRole,
  ApplicationMembershipStatus,
  ApplicationStatus,
  NotificationType,
} from '../../common/constants/app.constants';

type CreateAppData = {
  name: string;
  about: string;
  typeId: string;
  ownerId: string;
};

type CreateAppMembershipData = {
  applicationId: string;
  userId: string;
  role: ApplicationMembershipRole;
  status: ApplicationMembershipStatus;
  joinedAt: Date | null;
  invitedBy?: string | null;
};

type CreateCredentialData = {
  applicationId: string;
  isProductionEnabled: boolean;
};

type UpdateProductionModeData = {
  applicationId: string;
  isProductionEnabled: boolean;
};

type UpdateApplicationStatusData = {
  applicationId: string;
  status: ApplicationStatus;
};

type getAppsMembershipByUserId = {
  memberId: string;
  isActiveMembership: boolean;
};

type GetAppByNameForUserData = {
  name: string;
  userId: string;
};

type GetAppByIdForUserData = {
  applicationId: string;
  userId: string;
};

type GetOwnerMembershipForAppData = {
  applicationId: string;
  userId: string;
};

type CreateNotificationData = {
  applicationId: string;
  userId: string;
  type: NotificationType;
  message: string;
};

@Injectable()
export class ApplicationsRepository {
  constructor(
    @InjectModel(ApplicationTypes)
    private appTypesRepository: typeof ApplicationTypes,
    @InjectModel(Applications)
    private appsRepository: typeof Applications,
    @InjectModel(ApplicationMembership)
    private appMembershipRepository: typeof ApplicationMembership,

    @InjectModel(Users)
    private usersRepository: typeof Users,
    @InjectModel(Credentials)
    private credentialsRepository: typeof Credentials,
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    @InjectModel(Notifications)
    private notificationsRepository: typeof Notifications,
  ) {}

  async getAppTypes() {
    return await this.appTypesRepository.findAll();
  }

  async createApplication(data: CreateAppData, transaction?: Transaction) {
    return await this.appsRepository.create(
      {
        name: data.name,
        about: data.about,
        typeId: data.typeId,
        ownerId: data.ownerId,
      } as any,
      { transaction },
    );
  }

  async createApplicationMembership(
    data: CreateAppMembershipData,
    transaction?: Transaction,
  ) {
    return await this.appMembershipRepository.create(
      {
        applicationId: data.applicationId,
        userId: data.userId,
        role: data.role,
        status: data.status,
        joinedAt: data.joinedAt,
        invitedBy: data.invitedBy ?? null,
      } as any,
      { transaction },
    );
  }

  async getUserByEmail(email: string) {
    return await this.usersRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async createUserByEmail(email: string, transaction?: Transaction) {
    return await this.usersRepository.create(
      {
        email: email.toLowerCase().trim(),
      } as any,
      { transaction },
    );
  }

  async getMembershipByAppAndUser(applicationId: string, userId: string) {
    return await this.appMembershipRepository.findOne({
      where: { applicationId, userId },
      paranoid: false,
    });
  }

  async createNotification(
    data: CreateNotificationData,
    transaction?: Transaction,
  ) {
    return await this.notificationsRepository.create(
      {
        applicationId: data.applicationId,
        userId: data.userId,
        type: data.type,
        message: data.message,
      } as any,
      { transaction },
    );
  }

  async createCredential(
    data: CreateCredentialData,
    transaction?: Transaction,
  ) {
    return await this.credentialsRepository.create(
      {
        applicationId: data.applicationId,
        isProductionEnabled: data.isProductionEnabled,
      } as any,
      { transaction },
    );
  }

  async updateProductionMode(data: UpdateProductionModeData) {
    const credential = await this.credentialsRepository.findOne({
      where: { applicationId: data.applicationId },
    });

    if (!credential) {
      return null;
    }

    credential.isProductionEnabled = data.isProductionEnabled;

    return await credential.save();
  }

  async getOwnerMembershipForApp({
    applicationId,
    userId,
  }: GetOwnerMembershipForAppData) {
    return await this.appMembershipRepository.findOne({
      where: {
        applicationId,
        userId,
        role: ApplicationMembershipRole.OWNER,
        status: ApplicationMembershipStatus.ACTIVE,
      },
    });
  }

  async deleteCredentialsByApplicationId(
    applicationId: string,
    transaction?: Transaction,
  ) {
    return await this.credentialsRepository.destroy({
      where: { applicationId },
      transaction,
    });
  }

  async deleteMembershipsByApplicationId(
    applicationId: string,
    transaction?: Transaction,
  ) {
    return await this.appMembershipRepository.destroy({
      where: { applicationId },
      transaction,
    });
  }

  async deleteErrorsByApplicationId(
    applicationId: string,
    transaction?: Transaction,
  ) {
    return await this.errorsRepository.destroy({
      where: { applicationId },
      transaction,
    });
  }

  async deleteApplication(applicationId: string, transaction?: Transaction) {
    return await this.appsRepository.destroy({
      where: { id: applicationId },
      transaction,
    });
  }

  async updateApplicationStatus(data: UpdateApplicationStatusData) {
    const application = await this.appsRepository.unscoped().findOne({
      where: { id: data.applicationId },
    });

    if (!application) {
      return null;
    }

    application.status = data.status;

    return await application.save();
  }

  async getAppsMembershipByUserId({
    memberId: userId,
  }: getAppsMembershipByUserId) {
    return await this.appMembershipRepository.findAll({
      where: { userId, status: ApplicationMembershipStatus.ACTIVE },
      include: [{ model: Applications }],
    });
  }

  async getUserApps(userId: string) {
    return await this.appsRepository
      .scope({ method: ['associatedWithUser', userId] })
      .findAll({
        attributes: {
          include: [
            [
              literal(`(
                SELECT COUNT(*)
                FROM "application_memberships" AS "membership_count"
                WHERE "membership_count"."applicationId" = "Applications"."id"
                  AND "membership_count"."status" = '${ApplicationMembershipStatus.ACTIVE}'
                  AND "membership_count"."deletedAt" IS NULL
              )`),
              'membershipsCount',
            ],
          ],
          exclude: ['deletedAt', 'updatedAt', 'ownerId', 'typeId'],
        },
        include: [{ model: ApplicationTypes }],
      });
  }

  async getAppByNameForUser({ name, userId }: GetAppByNameForUserData) {
    return await this.appsRepository
      .scope({ method: ['associatedWithUser', userId] })
      .findOne({
        where: { name },
      });
  }

  async getAppByIdForUser({ applicationId, userId }: GetAppByIdForUserData) {
    return await this.appsRepository
      .scope({ method: ['associatedWithUser', userId] })
      .findOne({
        where: { id: applicationId },
        attributes: {
          include: [
            [
              literal(`(
                SELECT COUNT(*)
                FROM "application_memberships" AS "membership_count"
                WHERE "membership_count"."applicationId" = "Applications"."id"
                  AND "membership_count"."status" = '${ApplicationMembershipStatus.ACTIVE}'
                  AND "membership_count"."deletedAt" IS NULL
              )`),
              'membershipsCount',
            ],
          ],
          exclude: ['deletedAt', 'updatedAt', 'ownerId', 'typeId'],
        },
        include: [{ model: ApplicationTypes }],
      });
  }

  async getAllAppInfo({ applicationId, userId }: GetAppByIdForUserData) {
    return await this.appsRepository
      .unscoped()
      .scope({ method: ['associatedWithUser', userId] })
      .findOne({
        where: { id: applicationId },

        include: [
          {
            model: Credentials,
            as: 'credential',
            attributes: {
              exclude: ['deletedAt', 'updatedAt', 'id', 'applicationId'],
            },
          },
        ],
      });
  }

  async getApplicationMemberships(applicationId: string) {
    return await this.appMembershipRepository.findAll({
      where: {
        applicationId,
        status: ApplicationMembershipStatus.ACTIVE,
      },
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email'],
        },
      ],
      attributes: {
        exclude: ['applicationId', 'deletedAt', 'updatedAt', 'userId'],
      },
    });
  }
}
