import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
  HasMany,
  BeforeCreate,
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Subscriptions } from './subscription.model';

@Table({
  tableName: 'plans',
  timestamps: false, // TypeORM entity had no timestamps
})
export class Plans extends Model<Plans> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  price: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  description: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  isFree: boolean;

  @AllowNull(true)
  @Default(60)
  @Column(DataType.INTEGER)
  freeTrail: number;

  // ======================
  // Relations
  // ======================

  @HasMany(() => Subscriptions)
  subscription: Subscriptions[];

  //   @HasMany(() => PlanItems)
  //   planItems: PlanItems[];

  // ======================
  // Hooks
  // ======================

  @BeforeCreate
  static beforeCreateHook(instance: Plans) {
    instance.id = uuid();
  }
}
