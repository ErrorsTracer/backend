import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AUTH_CONSTANTS } from '../../common/constants/app.constants';
import { ERROR_KEYS } from '../../common/localization/error-keys';
import { RefreshTokenRequest } from './auth.types';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RefreshTokenRequest>();
    const refreshToken = this.extractRefreshTokenFromCookies(request);

    if (!refreshToken) {
      throw new UnauthorizedException(ERROR_KEYS.NO_REFRESH_TOKEN);
    }

    try {
      await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      request.refreshToken = refreshToken;
      return true;
    } catch {
      throw new UnauthorizedException(ERROR_KEYS.INVALID_REFRESH_TOKEN);
    }
  }

  private extractRefreshTokenFromCookies(
    request: RefreshTokenRequest,
  ): string | undefined {
    return (
      request as RefreshTokenRequest & { cookies?: Record<string, string> }
    ).cookies?.[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME];
  }
}
