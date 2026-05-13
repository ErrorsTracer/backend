import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersRepository } from './users.repo';
import { ERROR_KEYS } from '../../common/localization/error-keys';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async getUserInfo(user: { id?: string; sub?: string }) {
    const userId = user.id ?? user.sub;

    if (!userId) {
      throw new UnauthorizedException(ERROR_KEYS.INVALID_TOKEN_PAYLOAD);
    }

    const currentUser = await this.usersRepository.getUserById(userId);

    if (!currentUser) {
      throw new NotFoundException(ERROR_KEYS.USER_NOT_FOUND);
    }

    return currentUser;
  }

  async getUserNotifications(user: { id?: string; sub?: string }) {
    const userId = user.id ?? user.sub;

    if (!userId) {
      throw new UnauthorizedException(ERROR_KEYS.INVALID_TOKEN_PAYLOAD);
    }

    return await this.usersRepository.getNotificationsByUserId(userId);
  }

  async markNotificationAsRead(
    params: { id?: string },
    user: { id?: string; sub?: string },
  ) {
    const userId = user.id ?? user.sub;

    if (!userId) {
      throw new UnauthorizedException(ERROR_KEYS.INVALID_TOKEN_PAYLOAD);
    }

    const notification =
      await this.usersRepository.markNotificationAsReadByIdAndUserId(
        params.id,
        userId,
      );

    if (!notification) {
      throw new NotFoundException(ERROR_KEYS.NOTIFICATION_NOT_FOUND);
    }

    return { message: 'Notification marked as read successfully' };
  }
}
