import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ApplicationMembership } from '../../database/models/application-membership.model';
import { ApplicationTypes } from '../../database/models/application-types.model';
import { Applications } from '../../database/models/applications.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { OrganizationMembership } from '../../database/models/organization-membership.model';
import { Organizations } from '../../database/models/organizations.model';
import { Users } from '../../database/models/users.model';
import { TransactionManager } from '../../helpers/transaction.helper';
import { generateCred } from '../../utils/credentials';

type CreateAppData = {
  name: string;
  about: string;
  typeId: string;
  organizationId: string;
};

type OrgMembershipQuery = {
  orgId: string;
  userId: string;
  isOwner: boolean;
};

type findAppByNameAndOrgId = {
  name: string;
  orgId: string;
};

type getAppsMembershipByUserId = {
  memberId: string;
  isActiveMembership: boolean;
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
    @InjectModel(OrganizationMembership)
    private orgMembershipRepository: typeof OrganizationMembership,
    @InjectModel(Users)
    private usersRepository: typeof Users,
    @InjectModel(Credentials)
    private credentialsRepository: typeof Credentials,
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    private transactionManager: TransactionManager,
  ) {}

  async findAppByNameAndOrgId({ name, orgId }: findAppByNameAndOrgId) {
    return await this.appsRepository.findOne({
      where: { name, organizationId: orgId },
    });
  }

  async getOrgMembershipById({ orgId, userId, isOwner }: OrgMembershipQuery) {
    return await this.orgMembershipRepository.findOne({
      where: { organizationId: orgId, memberId: userId, isOwner },
      include: [{ model: Organizations }],
    });
  }

  async getAppTypeById(id: string) {
    return await this.appTypesRepository.findOne({ where: { id } });
  }

  async getAppTypes() {
    return await this.appTypesRepository.findAll();
  }

  async createApplication(data: CreateAppData, user) {
    const transaction = await this.transactionManager.runInTransaction(
      async (transaction) => {
        transaction;
        const newApp = await this.appsRepository.create(
          {
            name: data.name,
            about: data.about,
            typeId: data.typeId,
            organizationId: data.organizationId,
          } as any,
          { transaction },
        );

        const newAppMembership = await this.appMembershipRepository.create(
          {
            applicationId: newApp.dataValues.id,
            activeMembership: true,
            isActive: false,
            typeId: data.typeId,
            memberId: user.id,
          } as any,
          { transaction },
        );

        await this.credentialsRepository.create(
          {
            env: 'DEVELOPMENT',
            applicationId: newApp.dataValues.id,
            appKey: generateCred(),
          } as any,
          { transaction },
        );

        await this.credentialsRepository.create(
          {
            env: 'PRODUCTION',
            applicationId: newApp.dataValues.id,
            appKey: generateCred(),
          } as any,
          { transaction },
        );

        return { ...newAppMembership.dataValues, application: newApp };
      },
    );

    return transaction;
  }

  async getAppsMembershipByUserId({
    memberId,
    isActiveMembership,
  }: getAppsMembershipByUserId) {
    return await this.appMembershipRepository.findAll({
      where: { memberId, isActiveMembership },
      include: [{ model: Applications }],
    });
  }
}
