import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Users } from '../../database/models/users.model';
import { Organizations } from '../../database/models/organizations.model';
import { OrganizationMembership } from '../../database/models/organization-membership.model';
import { Credentials } from '../../database/models/credentials.model';
import { ApplicationMembership } from '../../database/models/application-membership.model';
import { Errors } from '../../database/models/errors.model';
import { Applications } from '../../database/models/applications.model';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Users)
    private usersRepository: typeof Users,
    @InjectModel(Organizations)
    private organizationsRepository: typeof Organizations,
    @InjectModel(OrganizationMembership)
    private orgMembershipRepository: typeof OrganizationMembership,
    @InjectModel(Credentials)
    private credentialsRepository: typeof Credentials,
    @InjectModel(ApplicationMembership)
    private appMembershipRepository: typeof ApplicationMembership,
    @InjectModel(Errors)
    private errorsRepository: typeof Errors,
    private jwtService: JwtService,
  ) {}

  // ================================
  // Get my organizations
  // ================================
  async getMyOrganizations(user) {
    const checkForUser = await this.usersRepository.findByPk(user.id);
    if (!checkForUser)
      throw new NotFoundException('No user associated with this account!');

    const myOrgsMembership = await this.orgMembershipRepository.findAll({
      where: { memberId: user.id, activeMembership: true },
      include: [{ model: Organizations }],
      order: [['createdAt', 'DESC']],
    });

    return myOrgsMembership;
  }

  // ================================
  // Invite member to organization
  // ================================
  async inviteMemberToOrg(data, user) {
    const checkForUser = await this.usersRepository.findByPk(user.id);
    if (!checkForUser)
      throw new UnauthorizedException('No user associated with this account!');

    const orgMembership = await this.orgMembershipRepository.findByPk(
      data.params.id,
      {
        include: [Organizations],
      },
    );

    if (!orgMembership || !orgMembership.isOwner)
      throw new UnauthorizedException('You are not the organization owner!');

    let invitedUser = await this.usersRepository.findOne({
      where: { email: data.data.email },
    });

    // Create guest account if not exist
    if (!invitedUser) {
      invitedUser = await (
        await this.usersRepository.create({
          firstName: null,
          lastName: null,
          email: data.data.email,
          password: null,
        } as any)
      ).save();
    }

    const membership = await this.orgMembershipRepository.create({
      isActive: false,
      isOwner: false,
      activeMembership: false,
      organizationId: orgMembership.organization.id,
      memberId: invitedUser.id,
    } as any);

    await membership.save();

    // const jwtPayload = { membership: membership.id, type: 'organization' };
    // const token = await this.jwtService.signAsync(jwtPayload);

    // const msg = {
    //   to: invitedUser.email,
    //   from: 'support@errorstracer.com',
    //   subject: 'Organization Invitation',
    //   html: `<div style="text-align: center"> ... </div>`, // your HTML content
    // };

    // await sendEmail(msg);

    return { message: 'Invitation sent successfully!' };
  }

  // ================================
  // Switch organization
  // ================================
  async switchOrganization(data, user) {
    const checkForUser = await this.usersRepository.findByPk(user.id);
    if (!checkForUser)
      throw new UnauthorizedException('No user associated with this account!');

    const currentMembership = await this.orgMembershipRepository.findByPk(
      data.id,
      {
        include: [Organizations],
      },
    );
    if (!currentMembership)
      throw new UnauthorizedException(
        'No organization associated with this id!',
      );

    const activeMembership = await this.orgMembershipRepository.findOne({
      where: { memberId: user.id },
    });

    if (activeMembership) {
      activeMembership.isActive = false;
      currentMembership.isActive = true;

      await activeMembership.save();
      await currentMembership.save();
    }

    return { message: 'Successfully switched!' };
  }

  // ================================
  // Create organization
  // ================================
  async createOrganization(data, user) {
    const org = await this.organizationsRepository.findOne({
      where: { name: data.name },
    });

    if (org?.toJSON())
      throw new UnprocessableEntityException(
        'This email and name are used in another organization!',
      );

    const newOrg = await this.organizationsRepository.create({
      email: data.email,
      name: data.name,
      ownerId: user.id,
    } as any);

    const appKey = randomBytes(13).toString('hex'); // 26 chars

    await this.credentialsRepository.create({
      appKey,
      organizationId: newOrg.id,
    } as any);

    const newOrgMembership = await this.orgMembershipRepository.create({
      organizationId: newOrg.id,
      memberId: user.id,
      isActive: false,
      activeMembership: true,
      isOwner: true,
    } as any);

    const myOrgMembership = await this.orgMembershipRepository.findByPk(
      newOrgMembership.id,
      {
        include: [{ model: Organizations }],
        order: [['createdAt', 'DESC']],
      },
    );

    return myOrgMembership;
  }

  // ================================
  // Leave organization
  // ================================
  async leaveOrg(data, user) {
    const membership = await this.orgMembershipRepository.findOne({
      where: { id: data.id, memberId: user.id },
    });

    if (!membership)
      throw new NotFoundException(
        'You have no membership in this organization!',
      );
    if (membership.isOwner)
      throw new UnprocessableEntityException(
        'You cannot leave the organizations you own!',
      );
    if (membership.isActive)
      throw new UnprocessableEntityException(
        'You cannot leave an active organization!',
      );

    membership.activeMembership = false;
    await membership.save();

    return await this.getMyOrganizations(user);
  }

  // ================================
  // Get Reports
  // ================================
  async getReports(user) {
    // 1️⃣ Check if user exists
    const checkForUser = (
      await this.usersRepository.findByPk(user.id)
    )?.toJSON();

    if (!checkForUser)
      throw new NotFoundException('No user associated with this account!');

    // 3️⃣ Total organizations where the user has active membership
    const totalOrgs = await this.orgMembershipRepository.findAndCountAll({
      where: { memberId: user.id, activeMembership: true },
      include: [Users],
      raw: true,
    });

    // 4️⃣ Total apps where the user is the owner
    const totalApps = await this.appMembershipRepository.findAndCountAll({
      where: { memberId: user.id, isOwner: true },
      include: [Users],
      raw: true,
    });

    // 5️⃣ Total shared apps (not owner)
    const totalSharedApps = await this.appMembershipRepository.findAndCountAll({
      where: { memberId: user.id, isOwner: false },
      include: [Users],
      raw: true,
    });

    // 6️⃣ Total errors for user's active organization

    const totalErrors = await this.errorsRepository.findAndCountAll({
      include: [
        {
          model: Applications,
          // where: { organizationId: activeOrg?.id },
        },
      ],
    });

    return {
      totalOrgs: totalOrgs.count,
      totalApps: totalApps.count,
      totalSharedApps: totalSharedApps.count,
      totalErrors: totalErrors.count,
    };
  }

  // ================================
  // Delete organization
  // ================================
  async deleteOrganization(params, user) {
    const checkUser = await this.usersRepository.findByPk(user.id);
    if (!checkUser) throw new NotFoundException('Account not found!');

    const org = await this.orgMembershipRepository.findOne({
      where: { id: params.id, memberId: checkUser.id, isOwner: true },
      include: [Organizations],
    });

    if (!org) throw new NotFoundException('Organization not found!');
    if (org.isActive)
      throw new UnprocessableEntityException(
        'You cannot delete an active organization!',
      );

    await this.organizationsRepository.destroy({
      where: { id: org.organizationId },
    });

    return { message: 'You have successfully deleted the organization!' };
  }

  // ================================
  // Verify invitation
  // ================================
  async verifyInvitation(data) {
    const invitation: any = this.jwtService.decode(data.token);
    if (!invitation) throw new NotFoundException('Invitation not found!');

    if (invitation.type === 'organization') {
      const orgMembership = await this.orgMembershipRepository.findByPk(
        invitation.membership,
      );
      if (!orgMembership) throw new NotFoundException('Invitation not found!');
      orgMembership.isActive = false;
      orgMembership.activeMembership = true;
      await orgMembership.save();
    } else {
      const appMembership = await this.appMembershipRepository.findByPk(
        invitation.membership,
      );
      if (!appMembership) throw new NotFoundException('Invitation not found!');
      appMembership.isActiveMembership = true;
      await appMembership.save();
    }

    return { message: 'Invitation Accepted Successfully!' };
  }
}
