import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';

import { SequelizeModule } from '@nestjs/sequelize';
import { ApplicationTypes } from '../../database/models/application-types.model';
import { Applications } from '../../database/models/applications.model';
import { Users } from '../../database/models/users.model';
import { ApplicationMembership } from '../../database/models/application-membership.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { Notifications } from '../../database/models/notifications.model';
import { TransactionManager } from '../../helpers/transaction.helper';
import { ApplicationsRepository } from './applications.repo';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      ApplicationTypes,
      Applications,
      Users,
      ApplicationMembership,
      Credentials,
      Errors,
      Notifications,
    ]),
    AuthModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService, TransactionManager, ApplicationsRepository],
})
export class ApplicationsModule {}
