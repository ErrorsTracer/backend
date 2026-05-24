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
  Query,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  CreateAppDto,
  GetApplicationErrorsDto,
  InvitePeopleDto,
} from './applications.dto';
import { UnGuard } from '../auth/auth.decorator';

@Controller({ path: 'applications', version: '0.1' })
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private appService: ApplicationsService) {}

  @Get('/')
  async getApps(@Req() req: any) {
    return await this.appService.getMyApps(req.user);
  }

  @Get('/:id/memberships')
  async getAppMemberships(@Param() params: any, @Req() req: any) {
    return await this.appService.getAppMemberships(params, req.user);
  }

  @UnGuard()
  @Get('/frameworks')
  async getFrameworks() {
    return await this.appService.getFrameworks();
  }

  @Get('/:id')
  async getAppInfo(@Param() data: any, @Req() req: any) {
    return await this.appService.getAppInfo(data, req.user);
  }

  @Get('/:id/errors')
  async getAppErrors(
    @Param() params: any,
    @Query() query: GetApplicationErrorsDto,
    @Req() req: any,
  ) {
    return await this.appService.getApplicationErrors(params, query, req.user);
  }

  @Get('/:id/errors/recent')
  async getRecentAppErrors(
    @Param() params: any,
    @Query() query: GetApplicationErrorsDto,
    @Req() req: any,
  ) {
    return await this.appService.getRecentApplicationErrors(
      params,
      query,
      req.user,
    );
  }

  @Get('/:id/errors/report')
  async getAppErrorsReport(@Param() params: any, @Req() req: any) {
    return await this.appService.getApplicationErrorsReport(params, req.user);
  }

  @Get('/:id/errors/:errorId')
  async getAppErrorDetails(@Param() params: any, @Req() req: any) {
    return await this.appService.getApplicationErrorDetails(params, req.user);
  }

  @Post('/')
  async createApp(@Body() data: CreateAppDto, @Req() req: any) {
    return await this.appService.createApp(data, req.user);
  }

  @Put('/:id/credentials/production')
  async updateProductionMode(@Param() params: any, @Req() req: any) {
    return await this.appService.updateProductionMode(params, req.user);
  }

  @Put('/:id/credentials/rotate')
  async rotateAppKey(@Param() params: any, @Req() req: any) {
    return await this.appService.rotateAppKey(params, req.user);
  }

  @Get('/:id/credentials')
  async getAppCredentials(@Param() params: any, @Req() req: any) {
    return await this.appService.getAppCredentials(params, req.user);
  }

  @Post('/:id/invite')
  async invitePeople(
    @Body() data: InvitePeopleDto,
    @Param() params: any,
    @Req() req: any,
  ) {
    return await this.appService.invitePeople(data, params, req.user);
  }

  @Put('/:id/activate')
  async activateApp(@Param() params: any, @Req() req: any) {
    return await this.appService.activateApp(params, req.user);
  }

  @Put('/:id/suspend')
  async suspendApp(@Param() params: any, @Req() req: any) {
    return await this.appService.suspendApp(params, req.user);
  }

  @Delete('/:id')
  async deleteApp(@Param() params: any, @Req() req: any) {
    return await this.appService.deleteApp(params, req.user);
  }

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
