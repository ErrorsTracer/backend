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
import { Organizations } from './organizations.model';
import { Users } from './users.model';

@Table({
  tableName: 'organization_memberships',
  timestamps: false, // manually managed
})
export class OrganizationMembership extends Model<OrganizationMembership> {
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
  activeMembership: boolean;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Organizations)
  @AllowNull(false)
  @Column(DataType.UUID)
  organizationId: string;

  @BelongsTo(() => Organizations, {
    onDelete: 'CASCADE',
  })
  organization: Organizations;

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
  static beforeCreateHook(instance: OrganizationMembership) {
    instance.id = uuid();
    instance.createdAt = new Date();
    instance.updatedAt = new Date();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: OrganizationMembership) {
    instance.updatedAt = new Date();
  }
}
