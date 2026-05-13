import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notifications } from '../../database/models/notifications.model';
import { Users } from '../../database/models/users.model';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(Users)
    private usersRepository: typeof Users,
    @InjectModel(Notifications)
    private notificationsRepository: typeof Notifications,
  ) {}

  async getUserById(id: string) {
    return await this.usersRepository.findByPk(id, {
      attributes: { exclude: ['id', 'createdAt', 'updatedAt', 'isSuspended'] },
    });
  }

  async getNotificationsByUserId(userId: string) {
    return await this.notificationsRepository.findAll({
      where: { userId },
      attributes: { exclude: ['userId', 'updatedAt'] },
      order: [['createdAt', 'DESC']],
    });
  }

  async markNotificationAsReadByIdAndUserId(
    id: string | undefined,
    userId: string,
  ) {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    notification.isRead = true;
    await notification.save();

    return notification;
  }
}
