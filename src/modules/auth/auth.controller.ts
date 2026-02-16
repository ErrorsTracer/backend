import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAccountDto, LoginDto } from './auth.dto';
import type { Response } from 'express';

@Controller({ path: 'auth', version: '0.1' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() data: LoginDto,
  ) {
    const result = await this.authService.login(data);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { accessToken: result.accessToken };
  }

  @Post('register')
  async register(@Body() data: CreateAccountDto) {
    return await this.authService.register(data);
  }
}
