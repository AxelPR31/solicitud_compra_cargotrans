import { Test, TestingModule } from '@nestjs/testing';
import { MayorAuditoriaController } from './mayor-auditoria.controller';
import { MayorAuditoriaService } from './mayor-auditoria.service';

describe('MayorAuditoriaController', () => {
  let controller: MayorAuditoriaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MayorAuditoriaController],
      providers: [MayorAuditoriaService],
    }).compile();

    controller = module.get<MayorAuditoriaController>(MayorAuditoriaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
