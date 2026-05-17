import { Module } from '@nestjs/common';
import { ErrorsController } from './errors.controller';
import { ErrorsService } from './errors.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Errors } from '../../database/models/errors.model';
import { Credentials } from '../../database/models/credentials.model';
import { Applications } from '../../database/models/applications.model';

@Module({
  imports: [SequelizeModule.forFeature([Errors, Credentials, Applications])],
  controllers: [ErrorsController],
  providers: [ErrorsService],
})
export class ErrorsModule {}
