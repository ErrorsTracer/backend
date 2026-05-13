import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
  HasOne,
  Index,
  Scopes,
} from 'sequelize-typescript';
import { Credentials } from './credentials.model';
import { ApplicationMembership } from './application-membership.model';
import { Errors } from './errors.model';
import { ApplicationTypes } from './application-types.model';
import { Users } from './users.model';
import { Notifications } from './notifications.model';
import {
  ApplicationMembershipStatus,
  ApplicationStatus,
} from '../../common/constants/app.constants';

@Scopes(() => ({
  associatedWithUser: (userId: string) => ({
    include: [
      {
        model: ApplicationMembership,
        attributes: [],
        where: {
          userId,
          status: ApplicationMembershipStatus.ACTIVE,
        },
        required: true,
      },
    ],
  }),
}))
@Table({
  tableName: 'applications',
  timestamps: true,
  paranoid: true,
  defaultScope: {
    where: {
      status: ApplicationStatus.ACTIVE,
    },
  },
})
export class Applications extends Model<Applications> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Index({ name: 'applications_owner_name_unique', unique: true })
  @Column(DataType.STRING(120))
  declare name: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare about: string | null;

  @Index
  @Column({
    type: DataType.ENUM(ApplicationStatus.ACTIVE, ApplicationStatus.SUSPENDED),
    allowNull: false,
    defaultValue: ApplicationStatus.ACTIVE,
  })
  declare status: ApplicationStatus;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare allowNotifications: boolean;

  // ======================
  // Relations
  // ======================

  @Index({ name: 'applications_owner_name_unique', unique: true })
  @Index
  @ForeignKey(() => Users)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare ownerId: string;

  @BelongsTo(() => Users, {
    foreignKey: 'ownerId',
    onDelete: 'RESTRICT',
  })
  declare owner: Users;

  @HasOne(() => Credentials, {
    onDelete: 'RESTRICT',
  })
  declare credential: Credentials;

  @HasMany(() => ApplicationMembership, {
    onDelete: 'RESTRICT',
  })
  declare memberships: ApplicationMembership[];

  @HasMany(() => Notifications, {
    onDelete: 'SET NULL',
  })
  declare notifications: Notifications[];

  // Uncomment if you re-enable Errors
  @HasMany(() => Errors)
  declare errors: Errors[];

  @Index
  @ForeignKey(() => ApplicationTypes)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare typeId: string;

  @BelongsTo(() => ApplicationTypes)
  declare type: ApplicationTypes;
}
