import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes, literal, Op, Transaction } from 'sequelize';
import { ApplicationMembership } from '../../database/models/application-membership.model';
import { Frameworks } from '../../database/models/frameworks.model';
import { Applications } from '../../database/models/applications.model';
import { Environments } from '../../database/models/environments.model';
import { Errors } from '../../database/models/errors.model';
import { Notifications } from '../../database/models/notifications.model';

import { Users } from '../../database/models/users.model';
import {
  ApplicationMembershipRole,
  ApplicationMembershipStatus,
  ApplicationStatus,
  NotificationType,
} from '../../common/constants/app.constants';
import { generateCred } from '../../utils/credentials';

type CreateAppData = {
  name: string;
  about: string;
  frameworkId: string;
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

type CreateEnvironmentData = {
  applicationId: string;
  isEnabled: boolean;
  envName: string;
};

type UpdateProductionModeData = {
  applicationId: string;
  isEnabled: boolean;
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

type ErrorCursorData = {
  createdAt: Date;
  id: string;
};

type GetErrorsByApplicationIdData = {
  applicationId: string;
  limit: number;
  cursor?: ErrorCursorData;
};

type GetRecentErrorsByApplicationIdData = {
  applicationId: string;
  limit: number;
};

type GetErrorDetailsByApplicationIdData = {
  applicationId: string;
  errorId: string;
};

@Injectable()
export class ApplicationsRepository {
  constructor(
    @InjectModel(Frameworks)
    private frameworksRepository: typeof Frameworks,
    @InjectModel(Applications)
    private appsRepository: typeof Applications,
    @InjectModel(ApplicationMembership)
    private appMembershipRepository: typeof ApplicationMembership,

    @InjectModel(Users)
    private usersRepository: typeof Users,
    @InjectModel(Environments)
    private environmentsRepository: typeof Environments,
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    @InjectModel(Notifications)
    private notificationsRepository: typeof Notifications,
  ) {}

  async getFrameworks() {
    return await this.frameworksRepository.findAll();
  }

  async createApplication(data: CreateAppData, transaction?: Transaction) {
    return await this.appsRepository.create(
      {
        name: data.name,
        about: data.about,
        frameworkId: data.frameworkId,
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

  async createEnvironment(
    data: CreateEnvironmentData,
    transaction?: Transaction,
  ) {
    return await this.environmentsRepository.create(
      {
        applicationId: data.applicationId,
        isEnabled: data.isEnabled,
        envName: data.envName,
      } as any,
      { transaction },
    );
  }

  async updateProductionMode(data: UpdateProductionModeData) {
    const environment = await this.environmentsRepository.findOne({
      where: { applicationId: data.applicationId },
    });

    if (!environment) {
      return null;
    }

    environment.isEnabled = data.isEnabled;

    return await environment.save();
  }

  async rotateAppKey(applicationId: string) {
    const environment = await this.environmentsRepository.findOne({
      where: { applicationId },
    });

    if (!environment) {
      return null;
    }

    environment.appKey = generateCred();

    return await environment.save();
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
    return await this.environmentsRepository.destroy({
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
                SELECT COUNT(*)::int
                FROM "application_memberships" AS "membership_count"
                WHERE "membership_count"."applicationId" = "Applications"."id"
                  AND "membership_count"."status" = '${ApplicationMembershipStatus.ACTIVE}'
              )`),
              'membershipsCount',
            ],
            [
              literal(`(
                SELECT COUNT(*)::int
                FROM "errors-logs" AS "errors_count"
                WHERE "errors_count"."applicationId" = "Applications"."id"
              )`),
              'totalErrors',
            ],
            [
              literal(`(
                SELECT COUNT(*)::int
                FROM "errors-logs" AS "critical_errors_count"
                WHERE "critical_errors_count"."applicationId" = "Applications"."id"
                  AND "critical_errors_count"."level" IN ('fatal', 'critical')
              )`),
              'criticalErrors',
            ],
          ],
          exclude: ['deletedAt', 'updatedAt', 'ownerId', 'frameworkId'],
        },
        include: [
          { model: Frameworks, attributes: ['name'] },
          { model: Environments, as: 'environment', attributes: ['envName'] },
        ],
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
              )`),
              'membershipsCount',
            ],
            [
              literal(`(
                SELECT COUNT(*)::int
                FROM "errors-logs" AS "errors_count"
                WHERE "errors_count"."applicationId" = "Applications"."id"
              )`),
              'errorsCount',
            ],
            [
              literal(`(
                SELECT COUNT(*)::int
                FROM "errors-logs" AS "critical_errors_count"
                WHERE "critical_errors_count"."applicationId" = "Applications"."id"
                  AND "critical_errors_count"."level" IN ('fatal', 'critical')
              )`),
              'criticalCount',
            ],
          ],
          exclude: ['deletedAt', 'updatedAt', 'ownerId', 'frameworkId'],
        },
        include: [
          { model: Frameworks, attributes: ['name'] },
          { model: Environments, as: 'environment', attributes: ['envName'] },
        ],
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
            model: Environments,
            as: 'environment',
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

  async getErrorsByApplicationId({
    applicationId,
    limit,
    cursor,
  }: GetErrorsByApplicationIdData) {
    return await this.errorsRepository.findAll({
      where: {
        applicationId,
        ...(cursor
          ? {
              [Op.or]: [
                { createdAt: { [Op.lt]: cursor.createdAt } },
                {
                  createdAt: cursor.createdAt,
                  id: { [Op.lt]: cursor.id },
                },
              ],
            }
          : {}),
      },
      order: [
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
      limit,
      attributes: {
        exclude: ['applicationId', 'updatedAt'],
      },
    });
  }

  async getRecentErrorsByApplicationId({
    applicationId,
    limit,
  }: GetRecentErrorsByApplicationIdData) {
    return await this.errorsRepository.sequelize!.query(
      `
        WITH grouped_errors AS (
          SELECT
            COALESCE("name", "error") AS "errorName",
            COUNT(*)::int AS "repeated",
            MAX("createdAt") AS "lastSeenAt"
          FROM "errors-logs"
          WHERE "applicationId" = :applicationId
          GROUP BY COALESCE("name", "error")
        ),
        latest_errors AS (
          SELECT DISTINCT ON (COALESCE(errors."name", errors."error"))
            errors."id",
            errors."error",
            errors."stack",
            errors."environment",
            errors."framework",
            errors."language",
            errors."runtime",
            errors."level",
            errors."name",
            errors."fingerprint",
            errors."handled",
            errors."timestamp",
            errors."release",
            errors."url",
            errors."transaction",
            errors."user",
            errors."request",
            errors."tags",
            errors."extra",
            errors."breadcrumbs",
            errors."contexts",
            errors."additionalData",
            errors."href",
            errors."host",
            errors."client",
            errors."clientAgent",
            errors."clientPlatform",
            errors."createdAt",
            COALESCE(errors."name", errors."error") AS "errorName"
          FROM "errors-logs" AS errors
          WHERE errors."applicationId" = :applicationId
          ORDER BY
            COALESCE(errors."name", errors."error"),
            errors."createdAt" DESC,
            errors."id" DESC
        )
        SELECT
          latest_errors.*,
          grouped_errors."repeated",
          grouped_errors."lastSeenAt"
        FROM latest_errors
        INNER JOIN grouped_errors
          ON grouped_errors."errorName" = latest_errors."errorName"
        ORDER BY grouped_errors."lastSeenAt" DESC, latest_errors."id" DESC
        LIMIT :limit
      `,
      {
        replacements: { applicationId, limit },
        type: QueryTypes.SELECT,
      },
    );
  }

  async getErrorDetailsByApplicationId({
    applicationId,
    errorId,
  }: GetErrorDetailsByApplicationIdData) {
    const [error] = await this.errorsRepository.sequelize!.query(
      `
        WITH selected_error AS (
          SELECT
            errors."id",
            errors."error",
            errors."stack",
            errors."environment",
            errors."framework",
            errors."language",
            errors."runtime",
            errors."level",
            errors."name",
            errors."fingerprint",
            errors."handled",
            errors."timestamp",
            errors."release",
            errors."url",
            errors."transaction",
            errors."user",
            errors."request",
            errors."tags",
            errors."extra",
            errors."breadcrumbs",
            errors."contexts",
            errors."additionalData",
            errors."href",
            errors."host",
            errors."client",
            errors."clientAgent",
            errors."clientPlatform",
            errors."createdAt",
            COALESCE(errors."name", errors."error") AS "errorName"
          FROM "errors-logs" AS errors
          WHERE errors."applicationId" = :applicationId
            AND errors."id" = :errorId
          LIMIT 1
        )
        SELECT
          selected_error.*,
          (
            SELECT COUNT(*)::int
            FROM "errors-logs" AS repeated_errors
            WHERE repeated_errors."applicationId" = :applicationId
              AND COALESCE(repeated_errors."name", repeated_errors."error") =
                selected_error."errorName"
          ) AS "repeated"
        FROM selected_error
      `,
      {
        replacements: { applicationId, errorId },
        type: QueryTypes.SELECT,
      },
    );

    return error ?? null;
  }
}
