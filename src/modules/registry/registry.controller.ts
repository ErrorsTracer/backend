import { Body, Controller, Post } from '@nestjs/common';
import { RegistryService } from './registry.service';

@Controller({ path: 'registry', version: '0.1' })
export class RegistryController {
  constructor(private registryService: RegistryService) {}

  @Post('/react')
  async createReactError(@Body() createReactErrorDto: any) {
    return await this.registryService.createReactError(createReactErrorDto);
  }
}
