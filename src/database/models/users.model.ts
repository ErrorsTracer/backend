import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
  Unique,
  HasMany,
  HasOne,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Organizations } from './organizations.model';
import { OrganizationMembership } from './organization-membership.model';
import { Subscriptions } from './subscription.model';
import { ApplicationMembership } from './application-membership.model';

@Table({
  tableName: 'users',
  timestamps: false, // you manage timestamps manually
})
export class Users extends Model<Users> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  firstName: string | null;

  @AllowNull(true)
  @Column(DataType.STRING)
  lastName: string | null;

  @Default('default.png')
  @AllowNull(false)
  @Column(DataType.STRING)
  avatar: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  email: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isVerified: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  password: string | null;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isSuspended: boolean;

  // ======================
  // Relations
  // ======================

  @HasMany(() => Organizations, 'userId')
  organizations: Organizations[];

  @HasMany(() => OrganizationMembership, 'userId')
  orgsMembership: OrganizationMembership[];

  @HasMany(() => ApplicationMembership, 'userId')
  appsMembership: ApplicationMembership[];

  @HasOne(() => Subscriptions, {
    onDelete: 'CASCADE',
  })
  subscription: Subscriptions;

  // ======================
  // Timestamps
  // ======================

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare updatedAt: Date;

  // ======================
  // Hooks
  // ======================

  @BeforeCreate
  static beforeCreateHook(instance: Users) {
    instance.id = uuid();
    instance.createdAt = new Date();
    instance.updatedAt = new Date();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: Users) {
    instance.updatedAt = new Date();
  }
}
