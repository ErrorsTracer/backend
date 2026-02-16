import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AllowNull,
  Default,
  BeforeCreate,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';

import { Users } from './users.model';

@Table({
  tableName: 'refresh_tokens',
  timestamps: false, // you manage timestamps manually
})
export class RefreshTokens extends Model<RefreshTokens> {
  @PrimaryKey
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  tokenHash: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isRevoked: boolean;

  // ======================
  // Relations
  // ======================

  @ForeignKey(() => Users)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;

  @BelongsTo(() => Users, {
    onDelete: 'CASCADE',
  })
  user: Users;

  // ======================
  // Timestamps
  // ======================

  @Column(DataType.DATE)
  declare createdAt: Date;

  @Column(DataType.DATE)
  declare expiresAt: Date;

  // ======================
  // Hooks
  // ======================

  @BeforeCreate
  static beforeCreateHook(instance: RefreshTokens) {
    instance.createdAt = new Date();
  }
}
