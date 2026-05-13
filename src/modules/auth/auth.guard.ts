import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

import { Request } from 'express';
import { IS_PUBLIC_KEY } from './auth.decorator';
import { ERROR_KEYS } from '../../common/localization/error-keys';
import { AUTH_CONSTANTS } from '../../common/constants/app.constants';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const accessToken = this.extractTokenFromHeader(request);
    const refreshToken = this.extractRefreshTokenFromCookies(request);
    const token = accessToken ?? refreshToken;
    const secret = accessToken
      ? (process.env.ACCESS_TOKEN_SECRET ?? process.env.JWT_SECRET)
      : process.env.REFRESH_TOKEN_SECRET;

    if (!token) {
      throw new UnauthorizedException(ERROR_KEYS.AUTH_REQUIRED);
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret,
      });

      request['user'] = {
        ...payload,
        id: payload.id ?? payload.sub,
      };
    } catch {
      throw new UnauthorizedException(
        accessToken
          ? ERROR_KEYS.INVALID_TOKEN
          : ERROR_KEYS.INVALID_REFRESH_TOKEN,
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type?.toLowerCase() === 'bearer' ? token : undefined;
  }

  private extractRefreshTokenFromCookies(request: Request): string | undefined {
    return (request as Request & { cookies?: Record<string, string> })
      .cookies?.[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME];
  }
}
