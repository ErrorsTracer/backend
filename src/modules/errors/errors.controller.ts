import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ErrorsService } from './errors.service';
import { IngestErrorDto } from './errors.dto';

@Controller({ path: 'errors', version: '0.1' })
export class ErrorsController {
  constructor(private errorsService: ErrorsService) {}

  @Post('/ingest')
  async ingestError(
    @Body() ingestErrorDto: IngestErrorDto,
    @Headers('x-errortracer-key') ingestionKey?: string,
  ) {
    return await this.errorsService.ingestError(ingestErrorDto, ingestionKey);
  }
}
