import { RefreshTokens } from './database/models/refresh-tokens.model';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './modules/auth/auth.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { Users } from './database/models/users.model';
import { Organizations } from './database/models/organizations.model';
import { OrganizationMembership } from './database/models/organization-membership.model';
import { Applications } from './database/models/applications.model';
import { ApplicationTypes } from './database/models/application-types.model';
import { ApplicationMembership } from './database/models/application-membership.model';
import { Credentials } from './database/models/credentials.model';
import { Plans } from './database/models/plans.model';
import { Subscriptions } from './database/models/subscription.model';
import { Errors } from './database/models/errors.model';

import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RegistryModule } from './modules/registry/registry.module';
import { ApplicationsModule } from './modules/applications/applications.module';

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
        Organizations,
        OrganizationMembership,
        Applications,
        ApplicationTypes,
        ApplicationMembership,
        Credentials,
        Plans,
        Subscriptions,
        Errors,
        RefreshTokens,
      ],
      logging: false,
      autoLoadModels: true,
      synchronize: true,
    }),
    AuthModule,
    OrganizationsModule,
    ApplicationsModule,
    RegistryModule,
    // PlansModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
