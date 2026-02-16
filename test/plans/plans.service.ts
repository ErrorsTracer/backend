import { Injectable } from '@nestjs/common';
import { Plans } from '../../database/entities/plans.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanItems } from '../../database/entities/planItem.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plans)
    private plansRepository: Repository<Plans>,
    @InjectRepository(PlanItems)
    private planItemsRepository: Repository<PlanItems>,
  ) {}

  async getPlans() {
    return await this.plansRepository.find({ relations: { planItems: true } });
  }
}
