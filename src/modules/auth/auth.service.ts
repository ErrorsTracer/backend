import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Users } from '../../database/models/users.model';
import { InjectModel } from '@nestjs/sequelize';
import { comparePassword } from '../../utils/bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateAccountDto } from './auth.dto';
import { AuthRepository } from './auth.repo';

import { createHash } from 'crypto';
import { ERROR_KEYS } from '../../common/localization/error-keys';
import { AUTH_CONSTANTS } from '../../common/constants/app.constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users)
    private readonly usersRepository: typeof Users,
    private jwtService: JwtService,
    private authRepository: AuthRepository,
  ) {}

  async register(data: CreateAccountDto) {
    const checkEmail = await this.usersRepository.findOne({
      where: {
        email: data.email,
      },
      raw: true,
    });

    if (checkEmail)
      throw new UnprocessableEntityException(ERROR_KEYS.EMAIL_ALREADY_EXISTS);

    await this.usersRepository.create({
      ...data,
    } as any);

    return;
  }

  async login(data: any) {
    const user = await this.authRepository.getUserByEmail(data.email, {
      attributes: {
        include: ['password'],
        exclude: ['createdAt', 'updatedAt', 'avatar', 'firstName', 'lastName'],
      },
    });

    if (!user)
      throw new UnauthorizedException(ERROR_KEYS.INCORRECT_CREDENTIALS);

    try {
      data.password = await comparePassword(
        data.password,
        user.password as string,
      );

      if (!data.password)
        throw new UnauthorizedException(ERROR_KEYS.INCORRECT_CREDENTIALS);

      const jwtPayload = { id: user.id, email: user.email };

      const accessToken = await this.jwtService.signAsync(jwtPayload, {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
      });

      const refreshToken = await this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: process.env.REFRESH_TOKEN_SECRET,
          expiresIn: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_IN,
        },
      );

      await this.authRepository.saveRefreshToken({
        refreshToken: refreshToken,
        userId: user.id,
      });

      return {
        accessToken: accessToken,
        refreshToken: refreshToken,
      };
    } catch {
      throw new UnauthorizedException(ERROR_KEYS.INCORRECT_CREDENTIALS);
    }
  }

  async validateRefreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const hashedRefreshToken = createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const user =
        await this.authRepository.findUserByRefreshToken(hashedRefreshToken);

      if (!user) {
        throw new UnauthorizedException(ERROR_KEYS.INVALID_REFRESH_TOKEN);
      }
      // console.log(
      //   'User found for refresh token:',
      //   user.hashedToken === hashedRefreshToken,
      // );

      const newAccessToken = this.jwtService.sign(
        { sub: payload.sub, email: payload.email },
        {
          secret: process.env.ACCESS_TOKEN_SECRET,
          expiresIn: AUTH_CONSTANTS.REFRESH_ACCESS_TOKEN_EXPIRES_IN,
        },
      );

      // const newRefreshToken = this.jwtService.sign(
      //   { sub: payload.sub },
      //   {
      //     secret: process.env.REFRESH_TOKEN_SECRET,
      //     expiresIn: AUTH_CONSTANTS.ROTATED_REFRESH_TOKEN_EXPIRES_IN,
      //   },
      // );

      //   await this.authRepository.saveRefreshToken({
      //   refreshToken: newRefreshToken,
      //   userId: payload.sub,
      // });

      return {
        accessToken: newAccessToken,
      };
    } catch {
      throw new UnauthorizedException(ERROR_KEYS.INVALID_REFRESH_TOKEN);
    }
  }

  async logout(refreshToken: string) {
    try {
      this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const hashedRefreshToken = createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      const revoked =
        await this.authRepository.revokeRefreshToken(hashedRefreshToken);

      if (!revoked) {
        throw new UnauthorizedException(ERROR_KEYS.INVALID_REFRESH_TOKEN);
      }
    } catch {
      throw new UnauthorizedException(ERROR_KEYS.INVALID_REFRESH_TOKEN);
    }
  }
}
