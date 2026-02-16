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
} from 'sequelize-typescript';
import { v4 as uuid } from 'uuid';
import { Organizations } from './organizations.model';
import { Applications } from './applications.model';

export enum CredentialEnv {
  DEVELOPMENT = 'DEVELOPMENT',
  PRODUCTION = 'PRODUCTION',
}

@Table({
  tableName: 'credentials',
  timestamps: false, // manual timestamps
})
export class Credentials extends Model<Credentials> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  appKey: string;

  @Default(CredentialEnv.DEVELOPMENT)
  @AllowNull(false)
  @Column(DataType.ENUM(CredentialEnv.DEVELOPMENT, CredentialEnv.PRODUCTION))
  env: CredentialEnv;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Applications)
  @AllowNull(true)
  @Column(DataType.UUID)
  applicationId: string | null;

  @BelongsTo(() => Applications, {
    onDelete: 'CASCADE',
  })
  application: Applications | null;

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
  static beforeCreateHook(instance: Credentials) {
    instance.id = uuid();
    instance.createdAt = new Date();
    instance.updatedAt = new Date();
  }

  @BeforeUpdate
  static beforeUpdateHook(instance: Credentials) {
    instance.updatedAt = new Date();
  }
}
