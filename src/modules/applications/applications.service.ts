import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { ApplicationsRepository } from './applications.repo';

@Injectable()
export class ApplicationsService {
  constructor(private applicationsRepository: ApplicationsRepository) {}

  async getApps(user) {
    const appsMembership =
      await this.applicationsRepository.getAppsMembershipByUserId({
        memberId: user.id,
        isActiveMembership: true,
      });

    return appsMembership;
  }

  async getAppTypes() {
    return await this.applicationsRepository.getAppTypes();
  }

  async createApp(data, user) {
    const org = await this.applicationsRepository.getOrgMembershipById({
      orgId: data.orgId,
      userId: user.id,
      isOwner: true,
    });

    if (!org)
      throw new UnauthorizedException(
        'You do not have permissions to create apps for this organization!',
      );

    const duplicatedApp =
      await this.applicationsRepository.findAppByNameAndOrgId({
        name: data.name,
        orgId: data.orgId,
      });

    if (duplicatedApp)
      throw new BadRequestException('This app is already exist!');

    const appType = await this.applicationsRepository.getAppTypeById(
      data.appType,
    );

    if (!appType)
      throw new BadRequestException('There is no app type with the given id!');

    return await this.applicationsRepository.createApplication(
      {
        name: data.name,
        about: data.about,
        typeId: appType.dataValues.id,
        organizationId: org.dataValues.organization.id,
      },
      user,
    );
  }

  // async getAppInfo(data, user) {
  //   // check app membership

  //   const membership = await this.appMembershipRepository.findOne({
  //     where: {
  //       member: { id: user.id },
  //       isActive: true,
  //       application: { id: data.id },
  //     },
  //     relations: ['member', 'application'],
  //   });

  //   // console.log(membership);

  //   // get app info with credentials
  //   const credentials = await this.credentialsRepository.find({
  //     where: { application: { id: membership.application.id } },
  //     relations: ['application'],
  //   });

  //   for (let i of credentials) {
  //     delete i.application;
  //   }
  //   delete membership.member;

  //   // if user is not owner, delete credentials from returned object

  //   const newData: any = {};

  //   if (membership.isOwner) newData.credentials = credentials;

  //   newData;

  //   newData.application = await this.appsRepository.findOne({
  //     where: { id: membership.application.id },
  //     relations: {
  //       type: true,
  //     },
  //   });

  //   // get all app memberships

  //   const members = await this.appMembershipRepository.find({
  //     where: { application: { id: membership.application.id } },
  //     relations: ['application', 'member'],
  //   });

  //   newData.members = members.map((item) => {
  //     if (item.member.email === user.email) {
  //       return { ...item, isYou: true };
  //     }
  //     return { ...item, isYou: false };
  //   });

  //   delete membership.application;
  //   newData.member = membership;

  //   return newData;
  // }

  // async invitePeople(data, params, user) {
  //   // check if owner is exist
  //   const checkForUser = await this.usersRepository.findOneBy({ id: user.id });

  //   if (!checkForUser)
  //     throw new UnauthorizedException('No user associated with this account!');

  //   // check if org is exist
  //   const appMembership: any = await this.appMembershipRepository.findOne({
  //     where: { application: { id: params.id } },
  //     relations: ['application'],
  //   });

  //   if (!appMembership.isOwner)
  //     throw new UnauthorizedException('You are not the application owner!');

  //   // check if the new user is already invited
  //   const checkForInvitedUser: any = await this.usersRepository.findOneBy({
  //     email: data.email,
  //   });

  //   // if invited user is not exist, create a guest account and send invitation email
  //   if (!checkForInvitedUser) {
  //     const newUser = await this.usersRepository.create({
  //       firstName: data.email.split('@')[0],
  //       lastName: null,
  //       email: data.data.email,
  //       password: null,
  //     });

  //     const savedUser: any = await this.usersRepository.save(newUser);

  //     const membership = await this.appMembershipRepository.create({
  //       isActive: false,
  //       isOwner: false,
  //       activeMembership: false,
  //       application: appMembership.application.id,
  //       member: savedUser.id,
  //     });

  //     await this.appMembershipRepository.save(membership);

  //     return await this.getAppInfo(params, user);
  //   } else {
  //     // create membership for the invited user
  //     const membership = await this.appMembershipRepository.create({
  //       isActive: true,
  //       isOwner: false,
  //       activeMembership: true,
  //       application: appMembership.application.id,
  //       member: checkForInvitedUser.id,
  //     } as any);

  //     await this.appMembershipRepository.save(membership);

  //     return await this.getAppInfo(params, user);
  //   }
  // }

  // async activateApp(params, user) {
  //   // check if owner is exist
  //   const checkForUser = await this.usersRepository.findOneBy({ id: user.id });

  //   if (!checkForUser)
  //     throw new UnauthorizedException('No user associated with this account!');

  //   // check if org is exist
  //   const appMembership: any = await this.appMembershipRepository.findOne({
  //     where: { application: { id: params.id } },
  //     relations: ['application'],
  //   });

  //   if (!appMembership.isOwner)
  //     throw new UnauthorizedException('You are not the application owner!');

  //   const application = await this.appsRepository.findOne({
  //     where: { id: appMembership.application.id },
  //   });

  //   application.isActive = true;

  //   await this.appsRepository.save(application);

  //   return await this.getAppInfo(params, user);
  // }

  // async getRegisteredErrors(params, user) {
  //   // check if user is exist
  //   const checkUser = await this.usersRepository.findOne({
  //     where: { id: user.id },
  //   });

  //   if (!checkUser) throw new NotFoundException('No user found!');

  //   // check if user has membership in the app
  //   const membership = await this.appMembershipRepository.findOne({
  //     where: {
  //       application: { id: params.id },
  //       member: { id: checkUser.id },
  //       activeMembership: true,
  //     },
  //     relations: {
  //       application: true,
  //       member: true,
  //     },
  //   });

  //   if (!membership)
  //     throw new UnprocessableEntityException('User membership is not active');

  //   const errors = await this.errorsRepository.find({
  //     where: { application: { id: membership.application.id } },
  //     relations: ['application'],
  //   });

  //   for (let i of errors) {
  //     delete i.application;
  //   }

  //   return errors;
  // }

  // async deactivateApp(params, user) {
  //   // check if owner is exist
  //   const checkForUser = await this.usersRepository.findOneBy({ id: user.id });

  //   if (!checkForUser)
  //     throw new UnauthorizedException('No user associated with this account!');

  //   // check if org is exist
  //   const appMembership: any = await this.appMembershipRepository.findOne({
  //     where: {
  //       application: { id: params.id },
  //       member: { id: checkForUser.id },
  //     },
  //     relations: ['application', 'member'],
  //   });

  //   if (!appMembership.isOwner)
  //     throw new UnauthorizedException('You are not the application owner!');

  //   const application = await this.appsRepository.findOne({
  //     where: { id: appMembership.application.id },
  //   });

  //   application.isActive = false;

  //   const allMemberships = await this.appMembershipRepository.find({
  //     where: { application: { id: application.id }, isOwner: false },
  //     relations: { application: true },
  //   });

  //   for (let i of allMemberships) {
  //     i.activeMembership = false;
  //     delete i.application;
  //   }

  //   await this.appsRepository.save(application);

  //   await this.appMembershipRepository.save(allMemberships);

  //   return await this.getAppInfo(params, user);
  // }

  // async deleteApp(params, user) {
  //   // check if owner is exist
  //   const checkForUser = await this.usersRepository.findOneBy({ id: user.id });

  //   if (!checkForUser)
  //     throw new UnauthorizedException('No user associated with this account!');

  //   // check if org is exist
  //   const appMembership: any = await this.appMembershipRepository.findOne({
  //     where: {
  //       application: { id: params.id },
  //       member: { id: checkForUser.id },
  //     },
  //     relations: ['application', 'member'],
  //   });

  //   if (!appMembership.isOwner)
  //     throw new UnauthorizedException('You are not the application owner!');

  //   const application = await this.appsRepository.findOne({
  //     where: { id: appMembership.application.id },
  //   });

  //   await this.appsRepository.remove(application);

  //   return { message: 'Application deleted successfully!' };
  // }

  // async updateApp(data, params, user) {
  //   // check if owner is exist

  //   const checkForUser = await this.usersRepository.findOneBy({ id: user.id });

  //   if (!checkForUser)
  //     throw new NotFoundException('No user associated with this account!');

  //   // check if org is exist
  //   const appMembership: any = await this.appMembershipRepository.findOne({
  //     where: {
  //       application: { id: params.id },
  //       member: { id: checkForUser.id },
  //     },
  //     relations: ['application', 'member'],
  //   });

  //   if (!appMembership.isOwner)
  //     throw new UnprocessableEntityException(
  //       'You are not the application owner!',
  //     );

  //   const application = await this.appsRepository.findOne({
  //     where: { id: appMembership.application.id },
  //   });

  //   if (typeof data?.allowNotifications !== 'undefined')
  //     application.allowNotifications = data?.allowNotifications;
  //   if (data?.name) application.name = data?.name;
  //   if (data?.about) application.about = data?.about;

  //   await this.appsRepository.save(application);

  //   return await this.getAppInfo(params, user);
  // }

  // async deleteMember(params, user) {
  //   const checkForUser = await this.usersRepository.findOneBy({ id: user.id });

  //   if (!checkForUser)
  //     throw new NotFoundException('No user associated with this account!');

  //   const appMembership = await this.appMembershipRepository.findOne({
  //     where: { id: params.id },
  //     relations: {
  //       member: true,
  //       application: true,
  //     },
  //   });

  //   if (!appMembership) throw new NotFoundException('No application found!');

  //   const ownerMembership = await this.appMembershipRepository.findOne({
  //     where: {
  //       application: { id: appMembership.application.id },
  //       member: { id: checkForUser.id },
  //     },
  //     relations: { application: true, member: true },
  //   });

  //   if (!ownerMembership.isOwner)
  //     throw new UnprocessableEntityException(
  //       'You do not have permissions to delete this membership!',
  //     );

  //   const membership = await this.appMembershipRepository.findOne({
  //     where: { id: appMembership.id },
  //   });

  //   await this.appMembershipRepository.remove(membership);

  //   return this.getAppInfo({ id: appMembership.application.id }, user);
  // }

  // async deactivateMember(params, user) {
  //   const checkForUser = await this.usersRepository.findOneBy({ id: user.id });

  //   if (!checkForUser)
  //     throw new NotFoundException('No user associated with this account!');

  //   const appMembership = await this.appMembershipRepository.findOne({
  //     where: { id: params.id },
  //     relations: {
  //       member: true,
  //       application: true,
  //     },
  //   });

  //   if (!appMembership) throw new NotFoundException('No application found!');

  //   const ownerMembership = await this.appMembershipRepository.findOne({
  //     where: {
  //       application: { id: appMembership.application.id },
  //       member: { id: checkForUser.id },
  //     },
  //     relations: { application: true, member: true },
  //   });

  //   if (!ownerMembership.isOwner)
  //     throw new UnprocessableEntityException(
  //       'You do not have permissions to delete this membership!',
  //     );

  //   const membership = await this.appMembershipRepository.findOne({
  //     where: { id: appMembership.id },
  //   });

  //   membership.activeMembership = !membership.activeMembership;

  //   await this.appMembershipRepository.save(membership);

  //   return this.getAppInfo({ id: appMembership.application.id }, user);
  // }
}
