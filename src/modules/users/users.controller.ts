import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { UsersService } from './users.service';

@Controller({ path: 'users', version: '0.1' })
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/profile')
  async getUserInfo(@Req() req: any) {
    return await this.usersService.getUserInfo(req.user);
  }

  @Get('/notifications')
  async getUserNotifications(@Req() req: any) {
    return await this.usersService.getUserNotifications(req.user);
  }

  @Patch('/notifications/:id/read')
  async markNotificationAsRead(@Param() params: any, @Req() req: any) {
    return await this.usersService.markNotificationAsRead(params, req.user);
  }
}
