import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { Users } from '../../database/models/users.model';
import { AuthRepository } from './auth.repo';
import { RefreshTokens } from '../../database/models/refresh-tokens.model';
import { RefreshTokenGuard } from './refresh-token.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    SequelizeModule.forFeature([Users, RefreshTokens]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET?.toString(),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, RefreshTokenGuard],
})
export class AuthModule {}
