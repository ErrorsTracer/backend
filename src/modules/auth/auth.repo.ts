import { Injectable } from '@nestjs/common';
import { Users } from '../../database/models/users.model';
import { InjectModel } from '@nestjs/sequelize';

import { RefreshTokens } from '../../database/models/refresh-tokens.model';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectModel(Users)
    private readonly usersRepository: typeof Users,
    @InjectModel(RefreshTokens)
    private readonly refreshTokensRepository: typeof RefreshTokens,
  ) {}

  async getUserByEmail(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email },
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });

    return user?.toJSON();
  }

  async saveRefreshToken({
    tokenId,
    tokenHash,
    userId,
  }: {
    tokenId: string;
    tokenHash: string;
    userId: string;
  }) {
    const refreshToken = await this.refreshTokensRepository.create({
      id: tokenId,
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      isRevoked: false,
    } as any);

    return refreshToken;
  }
}
