import { Body, Controller, Headers, Post } from '@nestjs/common';
import { RegistryService } from './registry.service';
import { IngestErrorDto } from './registry.dto';

@Controller({ path: 'errors', version: '0.1' })
export class ErrorsController {
  constructor(private registryService: RegistryService) {}

  @Post('/ingest')
  async ingestError(
    @Body() ingestErrorDto: IngestErrorDto,
    @Headers('x-errortracer-key') ingestionKey?: string,
  ) {
    return await this.registryService.ingestError(ingestErrorDto, ingestionKey);
  }
}
