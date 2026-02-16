import { Module } from '@nestjs/common';
import { PlansController } from './plans.controller';
import { PlansService } from './plans.service';
import { Plans } from '../../database/entities/plans.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanItems } from '../../database/entities/planItem.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Plans, PlanItems])],
  controllers: [PlansController],
  providers: [PlansService],
})
export class PlansModule {}
