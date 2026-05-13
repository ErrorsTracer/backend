import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
  BelongsTo,
  ForeignKey,
  BeforeCreate,
  Index,
} from 'sequelize-typescript';
import { createHash } from 'crypto';
import { Users } from './users.model';
import { RefreshTokenStatus } from '../../common/constants/app.constants';

@Table({
  tableName: 'refresh_tokens',
  timestamps: true,
})
export class RefreshTokens extends Model<RefreshTokens> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Index({ unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare hashedToken: string;

  @Column({
    type: DataType.ENUM(
      RefreshTokenStatus.ACTIVE,
      RefreshTokenStatus.REVOKED,
      RefreshTokenStatus.EXPIRED,
    ),
    allowNull: false,
    defaultValue: RefreshTokenStatus.ACTIVE,
  })
  declare status: RefreshTokenStatus;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @Column(DataType.STRING)
  declare deviceId: string | null;

  @Column(DataType.STRING)
  declare ipAddress: string | null;

  @Column(DataType.TEXT)
  declare userAgent: string | null;

  @Column(DataType.STRING)
  declare sessionId: string;
  // ======================
  // Relations
  // ======================

  @Index
  @ForeignKey(() => Users)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => Users, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  declare user: Users;

  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  @BeforeCreate
  static hashTokenHook(instance: RefreshTokens) {
    if (instance.hashedToken) {
      instance.hashedToken = createHash('sha256')
        .update(instance.hashedToken)
        .digest('hex');
    }
  }
}
