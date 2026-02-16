import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  HasMany,
  BeforeCreate,
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Applications } from './applications.model';

@Table({
  tableName: 'application_types',
  timestamps: false,
})
export class ApplicationTypes extends Model<ApplicationTypes> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  picture: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  about: string;

  // ======================
  // Relations
  // ======================

  @HasMany(() => Applications)
  applications: Applications[];

  // ======================
  // Hooks
  // ======================

  @BeforeCreate
  static beforeCreateHook(instance: ApplicationTypes) {
    instance.id = uuid();
  }
}
