import { Injectable } from '@nestjs/common';
import { Users } from '../../database/models/users.model';
import { InjectModel } from '@nestjs/sequelize';

import { RefreshTokens } from '../../database/models/refresh-tokens.model';
import {
  AUTH_CONSTANTS,
  RefreshTokenStatus,
} from '../../common/constants/app.constants';

type QueryOptions = { attributes: { include?: string[]; exclude?: string[] } };

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(Users)
    private readonly usersRepository: typeof Users,
    @InjectModel(RefreshTokens)
    private readonly refreshTokensRepository: typeof RefreshTokens,
  ) {}

  async getUserByEmail(email: string, queryOptions?: QueryOptions) {
    const user = await this.usersRepository.findOne({
      where: { email },
      attributes: {
        include: queryOptions?.attributes.include || [],
        exclude: queryOptions?.attributes.exclude || [],
      },
    });

    return user?.toJSON();
  }

  async saveRefreshToken({
    refreshToken,
    userId,
  }: {
    refreshToken: string;
    userId: string;
  }) {
    const result = await this.refreshTokensRepository.create({
      hashedToken: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_MAX_AGE_MS),
      isRevoked: false,
    } as any);
    return result?.toJSON();
  }

  async findUserByRefreshToken(hashedToken: string) {
    const refreshToken = await this.refreshTokensRepository.findOne({
      where: { hashedToken, status: RefreshTokenStatus.ACTIVE },
      include: [{ model: Users, attributes: ['id', 'email'] }],
    });
    return refreshToken?.toJSON();
  }

  async revokeRefreshToken(hashedToken: string) {
    const [affectedCount] = await this.refreshTokensRepository.update(
      { status: RefreshTokenStatus.REVOKED },
      {
        where: {
          hashedToken,
          status: RefreshTokenStatus.ACTIVE,
        },
      },
    );

    return affectedCount > 0;
  }
}
