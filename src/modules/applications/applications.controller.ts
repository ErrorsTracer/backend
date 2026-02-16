import {
  Controller,
  Get,
  Req,
  UseGuards,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateAppDto } from './applications.dto';

@Controller({ path: 'applications', version: '0.1' })
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private appService: ApplicationsService) {}

  @Get('/')
  async getApps(@Body() data: any, @Req() req: any) {
    return await this.appService.getApps(req.user);
  }

  @Get('/types')
  async getAppTypes() {
    return await this.appService.getAppTypes();
  }

  // @Get('/:id')
  // async getAppInfo(@Param() data: any, @Req() req: any) {
  //   return await this.appService.getAppInfo(data, req.user);
  // }

  // @Get('/:id/errors')
  // async getAppErrors(@Param() data: any, @Req() req: any) {
  //   return await this.appService.getRegisteredErrors(data, req.user);
  // }

  @Post('/')
  async createApp(@Body() data: CreateAppDto, @Req() req: any) {
    return await this.appService.createApp(data, req.user);
  }

  // @Post('/:id/invite')
  // async invitePeople(@Body() data: any, @Param() params: any, @Req() req: any) {
  //   return await this.appService.invitePeople(data, params, req.user);
  // }

  // @Put('/:id/activate')
  // async activateApp(@Param() params: any, @Req() req: any) {
  //   return await this.appService.activateApp(params, req.user);
  // }

  // @Put('/:id/deactivate')
  // async deactivateApp(@Param() params: any, @Req() req: any) {
  //   return await this.appService.deactivateApp(params, req.user);
  // }

  // @Delete('/:id')
  // async deleteApp(@Param() params: any, @Req() req: any) {
  //   return await this.appService.deleteApp(params, req.user);
  // }

  // @Put('/:id')
  // async updateApp(@Body() data, @Param() params: any, @Req() req: any) {
  //   return await this.appService.updateApp(data, params, req.user);
  // }

  // @Delete('/:id/membership')
  // async deleteMember(@Param() params: any, @Req() req: any) {
  //   return await this.appService.deleteMember(params, req.user);
  // }

  // @Put('/:id/membership')
  // async deactivateMember(@Param() params: any, @Req() req: any) {
  //   return await this.appService.deactivateMember(params, req.user);
  // }
}
