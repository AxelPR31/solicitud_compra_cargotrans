import { Test, TestingModule } from '@nestjs/testing';
import { MayorAuditoriaService } from './mayor-auditoria.service';

describe('MayorAuditoriaService', () => {
  let service: MayorAuditoriaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MayorAuditoriaService],
    }).compile();

    service = module.get<MayorAuditoriaService>(MayorAuditoriaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
