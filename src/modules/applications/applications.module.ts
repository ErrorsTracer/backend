import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

import { SequelizeModule } from '@nestjs/sequelize';
import { ApplicationTypes } from '../../database/models/application-types.model';
import { Applications } from '../../database/models/applications.model';
import { OrganizationMembership } from '../../database/models/organization-membership.model';
import { Users } from '../../database/models/users.model';
import { ApplicationMembership } from '../../database/models/application-membership.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { TransactionManager } from '../../helpers/transaction.helper';
import { ApplicationsRepository } from './applications.repo';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ApplicationTypes,
      Applications,
      OrganizationMembership,
      Users,
      ApplicationMembership,
      Credentials,
      Errors,
    ]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, TransactionManager, ApplicationsRepository],
})
export class ApplicationsModule {}
