import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { ApplicationMembership } from '../../database/models/application-membership.model';
import { ApplicationTypes } from '../../database/models/application-types.model';
import { Applications } from '../../database/models/applications.model';
import { Credentials } from '../../database/models/credentials.model';
import { Errors } from '../../database/models/errors.model';
import { OrganizationMembership } from '../../database/models/organization-membership.model';
import { Organizations } from '../../database/models/organizations.model';
import { Users } from '../../database/models/users.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Users,
      Organizations,
      OrganizationMembership,
      Credentials,
      ApplicationMembership,
      ApplicationTypes,
      Applications,
      Errors,
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
