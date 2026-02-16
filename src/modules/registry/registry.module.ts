import { Module } from '@nestjs/common';
import { RegistryController } from './registry.controller';
import { RegistryService } from './registry.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Errors } from '../../database/models/errors.model';
import { Credentials } from '../../database/models/credentials.model';
import { Organizations } from '../../database/models/organizations.model';
import { Applications } from '../../database/models/applications.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Errors,
      Credentials,
      Organizations,
      Applications,
    ]),
  ],
  controllers: [RegistryController],
  providers: [RegistryService],
})
export class RegistryModule {}
