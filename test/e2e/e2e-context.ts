import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { Sequelize } from 'sequelize-typescript';

export class NestAppSingleton {
  private static app: INestApplication | null = null;
  private static sequelize: Sequelize | null = null;

  private constructor() {}

  static async getInstance(): Promise<INestApplication> {
    if (!this.app) {
      const moduleFixture = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const app = moduleFixture.createNestApplication();
      await app.init();

      this.app = app;
    }

    return this.app;
  }

  static async close() {
    await this.app?.close();

    this.app = null;
  }
}
