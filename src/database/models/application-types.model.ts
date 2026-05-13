import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  HasMany,
  Default,
  Index,
  BeforeCreate,
} from 'sequelize-typescript';
import { Applications } from './applications.model';

@Table({
  tableName: 'application_types',
  timestamps: false,
})
export class ApplicationTypes extends Model<ApplicationTypes> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Index({ unique: true })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare type: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare picture: string;

  @AllowNull(true)
  @Column(DataType.TEXT)
  declare about: string;

  // ======================
  // Relations
  // ======================

  @HasMany(() => Applications, {
    foreignKey: 'typeId',
  })
  declare applications: Applications[];

  @BeforeCreate
  static normalizeType(instance: ApplicationTypes) {
    instance.type = instance.type.toLowerCase().trim();
  }
}
