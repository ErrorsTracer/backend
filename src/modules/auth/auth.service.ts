import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Users } from '../../database/models/users.model';
import { InjectModel } from '@nestjs/sequelize';
import {
  comparePassword,
  generateRefreshToken,
  hashPassword,
  hashRefreshToken,
} from '../../utils/bcrypt';
import { JwtService } from '@nestjs/jwt';
import { CreateAccountDto } from './auth.dto';
import { AuthRepository } from './auth.repo';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users)
    private readonly usersRepository: typeof Users,
    private jwtService: JwtService,
    private authRepository: AuthRepository,
  ) {}

  async register(data: CreateAccountDto) {
    const checkEmail = await this.usersRepository.findOne({
      where: {
        email: data.email,
      },
      raw: true,
    });
    console.log('🚀 ~ AuthService ~ register ~ checkEmail:', checkEmail);

    if (checkEmail)
      throw new UnprocessableEntityException('This email is already exist!');

    if (data.password !== data.confirmPassword)
      throw new BadRequestException('Passwords are not matched!');

    delete data?.confirmPassword;

    data.password = (await hashPassword(data.password)) as string;

    const newAccount = await this.usersRepository.create({
      ...data,
    } as any);

    const user = (await newAccount.save()).toJSON();

    const jwtPayload = { id: user.id, email: user.email };

    const token = await this.jwtService.signAsync(jwtPayload);

    // delete user.password;

    // delete user.isVerified;
    // delete user.suspended;

    return {
      accessToken: token,
    };
  }

  async login(data: any) {
    const user = await this.authRepository.getUserByEmail(data.email);

    if (!user)
      throw new UnauthorizedException(
        'Incorrect credentials, please try again!',
      );

    try {
      data.password = await comparePassword(
        data.password,
        user.password as string,
      );

      if (!data.password)
        throw new UnauthorizedException(
          'Incorrect credentials, please try again!',
        );

      const jwtPayload = { id: user.id, email: user.email };

      const token = await this.jwtService.signAsync(jwtPayload);

      const { tokenId, refreshToken } = generateRefreshToken();
      const tokenHash = await hashRefreshToken(refreshToken);

      await this.authRepository.saveRefreshToken({
        tokenHash,
        tokenId,
        userId: user.id,
      });

      return {
        accessToken: token,
        refreshToken: tokenHash,
      };
    } catch (err) {
      throw new UnauthorizedException(
        'Incorrect credentials, please try again!',
      );
    }
  }
}
