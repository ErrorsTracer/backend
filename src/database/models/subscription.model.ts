import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
  HasOne,
  BeforeCreate,
  BeforeUpdate,
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Plans } from './plans.model';
import { Users } from './users.model';

@Table({
  tableName: 'subscriptions',
  timestamps: true, // we DO want createdAt / updatedAt
})
export class Subscriptions extends Model<Subscriptions> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Plans)
  @AllowNull(false)
  @Column(DataType.UUID)
  planId: string;

  @BelongsTo(() => Plans)
  plan: Plans;

  @ForeignKey(() => Users)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;

  @BelongsTo(() => Users)
  user: Users;

  // ======================
  // Columns
  // ======================

  @AllowNull(true)
  @Column(DataType.DATE)
  expiresIn: Date;

  // ======================
  // Hooks
  // ======================

  @BeforeCreate
  static beforeCreateHook(instance: Subscriptions) {
    instance.id = uuid();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: Subscriptions) {
    instance.updatedAt = new Date();
  }
}
