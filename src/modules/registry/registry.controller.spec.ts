import { Test, TestingModule } from '@nestjs/testing';
import { RegistryController } from './registry.controller';

describe('TraceController', () => {
  let controller: RegistryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistryController],
    }).compile();

    controller = module.get<RegistryController>(RegistryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
