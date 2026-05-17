import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthSessions } from './database/models/auth-sessions.model';
import { Users } from './database/models/users.model';
import { Applications } from './database/models/applications.model';
import { ApplicationTypes } from './database/models/application-types.model';
import { ApplicationMembership } from './database/models/application-membership.model';
import { Credentials } from './database/models/credentials.model';

import { Errors } from './database/models/errors.model';
import { Notifications } from './database/models/notifications.model';

import { ErrorsModule } from './modules/errors/errors.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST?.toString(),
      username: process.env.DB_USER?.toString(),
      password: process.env.DB_PASSWORD?.toString(),
      database: process.env.DB_NAME?.toString(),
      port: Number(process.env.DB_PORT),
      models: [
        Users,
        ApplicationTypes,
        Applications,
        ApplicationMembership,
        Credentials,
        Notifications,
        Errors,
        AuthSessions,
      ],
      logging: false,
      autoLoadModels: true,
      synchronize: process.env.NODE_ENV === 'test' ? false : true,
    }),
    AuthModule,
    UsersModule,
    ApplicationsModule,
    ErrorsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
