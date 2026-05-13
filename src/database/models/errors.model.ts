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
  tableName: 'errors-logs',
  timestamps: true,
})
export class Errors extends Model<Errors> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare error: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare stack: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare additionalData: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare href: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare host: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare client: string;

  @Default(1)
  @Column(DataType.INTEGER)
  declare repeated: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare clientAgent: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare clientPlatform: string;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Applications)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare applicationId: string;

  @BelongsTo(() => Applications)
  declare application: Applications;

  // ======================
  // Hooks
  // ======================

  @BeforeCreate
  static beforeCreateHook(instance: Errors) {
    instance.id = uuid();
  }
}
