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
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Applications } from './applications.model';

@Table({
  tableName: 'errors',
  timestamps: true,
})
export class Errors extends Model<Errors> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  error: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  stack: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  additionalData: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  href: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  host: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  client: string;

  @Default(1)
  @Column(DataType.INTEGER)
  repeated: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  clientAgent: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  clientPlatform: string;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Applications)
  @AllowNull(false)
  @Column(DataType.UUID)
  applicationId: string;

  @BelongsTo(() => Applications)
  application: Applications;

  // ======================
  // Hooks
  // ======================

  @BeforeCreate
  static beforeCreateHook(instance: Errors) {
    instance.id = uuid();
  }
}
