import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notifications } from '../../database/models/notifications.model';
import { Users } from '../../database/models/users.model';
import { UsersController } from './users.controller';
import { UsersRepository } from './users.repo';
import { UsersService } from './users.service';

@Module({
  imports: [SequelizeModule.forFeature([Users, Notifications])],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
})
export class UsersModule {}
