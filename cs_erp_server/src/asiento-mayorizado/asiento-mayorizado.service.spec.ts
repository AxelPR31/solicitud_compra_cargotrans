import { Test, TestingModule } from '@nestjs/testing';
import { AsientoMayorizadoService } from './asiento-mayorizado.service';

describe('AsientoMayorizadoService', () => {
  let service: AsientoMayorizadoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsientoMayorizadoService],
    }).compile();

    service = module.get<AsientoMayorizadoService>(AsientoMayorizadoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
