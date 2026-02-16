import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
  BeforeCreate,
  BeforeUpdate,
  ForeignKey,
  BelongsTo,
  HasOne,
  HasMany,
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Users } from './users.model';
import { Credentials } from './credentials.model';
import { OrganizationMembership } from './organization-membership.model';
import { Applications } from './applications.model';

@Table({
  tableName: 'organizations',
  timestamps: false, // you manage timestamps manually
})
export class Organizations extends Model<Organizations> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  email: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  website: string | null;

  @AllowNull(true)
  @Column(DataType.TEXT)
  about: string | null;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isActive: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isDeleted: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isSuspended: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  allowNotifications: boolean;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Users)
  @AllowNull(false)
  @Column(DataType.UUID)
  ownerId: string;

  @BelongsTo(() => Users)
  owner: Users;

  @HasMany(() => OrganizationMembership, {
    onDelete: 'CASCADE',
  })
  membership: OrganizationMembership[];

  @HasMany(() => Applications, {
    onDelete: 'CASCADE',
  })
  applications: Applications[];

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
  static beforeCreateHook(instance: Organizations) {
    instance.id = uuid();
    instance.createdAt = new Date();
    instance.updatedAt = new Date();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: Organizations) {
    instance.updatedAt = new Date();
  }
}
