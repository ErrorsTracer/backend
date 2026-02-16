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
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Applications } from './applications.model';
import { Users } from './users.model';

@Table({
  tableName: 'application_memberships',
  timestamps: false, // timestamps are manually handled
})
export class ApplicationMembership extends Model<ApplicationMembership> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isActive: boolean;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isOwner: boolean;

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isActiveMembership: boolean;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Applications)
  @AllowNull(false)
  @Column(DataType.UUID)
  applicationId: string;

  @BelongsTo(() => Applications, {
    onDelete: 'CASCADE',
  })
  application: Applications;

  @ForeignKey(() => Users)
  @AllowNull(false)
  @Column(DataType.UUID)
  memberId: string;

  @BelongsTo(() => Users)
  member: Users;

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
  static beforeCreateHook(instance: ApplicationMembership) {
    instance.id = uuid();
    instance.createdAt = new Date();
    instance.updatedAt = new Date();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: ApplicationMembership) {
    instance.updatedAt = new Date();
  }
}
