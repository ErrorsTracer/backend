import { Module } from '@nestjs/common';
import { ErrorsController } from './registry.controller';
import { RegistryService } from './registry.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Errors } from '../../database/models/errors.model';
import { Credentials } from '../../database/models/credentials.model';
import { Applications } from '../../database/models/applications.model';

@Module({
  imports: [SequelizeModule.forFeature([Errors, Credentials, Applications])],
  controllers: [ErrorsController],
  providers: [RegistryService],
})
export class RegistryModule {}
