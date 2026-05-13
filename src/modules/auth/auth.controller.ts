import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDto, LoginDto } from './auth.dto';
import type { Response, Request } from 'express';
import { ERROR_KEYS } from '../../common/localization/error-keys';
import { AUTH_CONSTANTS } from '../../common/constants/app.constants';

@Controller({ path: 'auth', version: '0.1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Body() data: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(data);

    res.cookie(AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      // path: '/auth/login',
      maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_MAX_AGE_MS,
    });

    return { accessToken };
  }

  @Post('register')
  async register(@Body() data: CreateAccountDto) {
    return await this.authService.register(data);
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies[AUTH_CONSTANTS.REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException(ERROR_KEYS.NO_REFRESH_TOKEN);
    }

    return await this.authService.validateRefreshToken(refreshToken);
  }
}
