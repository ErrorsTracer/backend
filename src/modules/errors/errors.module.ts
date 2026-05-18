import { Module } from '@nestjs/common';
import { ErrorsController } from './errors.controller';
import { ErrorsService } from './errors.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Errors } from '../../database/models/errors.model';
import { Environments } from '../../database/models/environments.model';
import { Applications } from '../../database/models/applications.model';

@Module({
  imports: [SequelizeModule.forFeature([Errors, Environments, Applications])],
  controllers: [ErrorsController],
  providers: [ErrorsService],
})
export class ErrorsModule {}
