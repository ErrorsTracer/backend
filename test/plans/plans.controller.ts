import { Controller, Get } from '@nestjs/common';
import { PlansService } from './plans.service';

@Controller({ path: 'plans', version: '0.1' })
export class PlansController {
  constructor(private plansService: PlansService) {}

  @Get('/')
  async getPlans() {
    return await this.plansService.getPlans();
  }
}
