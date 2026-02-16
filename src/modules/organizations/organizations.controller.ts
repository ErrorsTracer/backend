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
import { OrganizationsService } from './organizations.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller({ path: 'organizations', version: '0.1' })
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}
  @UseGuards(AuthGuard)
  @Get('/')
  async getMyOrganizations(@Req() req: any) {
    return await this.orgsService.getMyOrganizations(req.user);
  }

  @UseGuards(AuthGuard)
  @Post('/:id/invite')
  async inviteToOrganization(@Body() data, @Param() params, @Req() req: any) {
    return await this.orgsService.inviteMemberToOrg({ params, data }, req.user);
  }
  @UseGuards(AuthGuard)
  @Put('/:id/switch')
  async switchOrganization(@Param() params, @Req() req: any) {
    return await this.orgsService.switchOrganization(params, req.user);
  }
  @UseGuards(AuthGuard)
  @Post('/')
  async createOrganization(@Body() data, @Req() req: any) {
    return await this.orgsService.createOrganization(data, req.user);
  }
  @UseGuards(AuthGuard)
  @Put('/:id')
  async leaveOrganization(@Param() params, @Req() req: any) {
    return await this.orgsService.leaveOrg(params, req.user);
  }
  @UseGuards(AuthGuard)
  @Get('/general-reports')
  async getReports(@Req() req: any) {
    return await this.orgsService.getReports(req.user);
  }
  @UseGuards(AuthGuard)
  @Delete('/:id')
  async deleteOrganization(@Param() params, @Req() req: any) {
    return await this.orgsService.deleteOrganization(params, req.user);
  }

  @Post('/membership/verify-invitation')
  async verifyInvitation(@Body() data, @Req() req: any) {
    return await this.orgsService.verifyInvitation(data);
  }
}
