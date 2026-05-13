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
  Index,
} from 'sequelize-typescript';
import { randomBytes } from 'crypto';
import { Applications } from './applications.model';

@Table({
  tableName: 'credentials',
  timestamps: true,
})
export class Credentials extends Model<Credentials> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Index({ unique: true })
  @Column(DataType.STRING)
  declare appKey: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare isProductionEnabled: boolean;

  // ======================
  // Relations
  // ======================

  @Index({ unique: true })
  @ForeignKey(() => Applications)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare applicationId: string;

  @BelongsTo(() => Applications, {
    onDelete: 'CASCADE',
  })
  declare application: Applications;

  @BeforeCreate
  static saveAppKey(instance: Credentials) {
    if (!instance.appKey) {
      instance.appKey = Credentials.generateAppKey();
    }
  }

  private static generateAppKey(length = 26): string {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(length);

    return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join(
      '',
    );
  }
}
