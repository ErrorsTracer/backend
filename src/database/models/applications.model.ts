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
  HasMany,
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Organizations } from './organizations.model';
import { Credentials } from './credentials.model';
import { ApplicationMembership } from './application-membership.model';
import { Errors } from './errors.model';
import { ApplicationTypes } from './application-types.model';

// import { Errors } from './Errors';

@Table({
  tableName: 'applications',
  timestamps: false, // manually handled
})
export class Applications extends Model<Applications> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

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

  @HasMany(() => Credentials, {
    onDelete: 'CASCADE',
  })
  credentials: Credentials[];

  @HasMany(() => ApplicationMembership, {
    onDelete: 'CASCADE',
  })
  membership: ApplicationMembership[];

  // Uncomment if you re-enable Errors
  @HasMany(() => Errors)
  errors: Errors[];

  @ForeignKey(() => ApplicationTypes)
  @AllowNull(false)
  @Column(DataType.UUID)
  typeId: string;

  @BelongsTo(() => ApplicationTypes)
  type: ApplicationTypes;

  @ForeignKey(() => Organizations)
  @AllowNull(false)
  @Column(DataType.UUID)
  organizationId: string;

  @BelongsTo(() => Organizations)
  organization: Organizations;

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
  static beforeCreateHook(instance: Applications) {
    instance.id = uuid();
    instance.createdAt = new Date();
    instance.updatedAt = new Date();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: Applications) {
    instance.updatedAt = new Date();
  }
}
