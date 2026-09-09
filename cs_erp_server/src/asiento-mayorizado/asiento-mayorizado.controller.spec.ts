import { Test, TestingModule } from '@nestjs/testing';
import { AsientoMayorizadoController } from './asiento-mayorizado.controller';
import { AsientoMayorizadoService } from './asiento-mayorizado.service';

describe('AsientoMayorizadoController', () => {
  let controller: AsientoMayorizadoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsientoMayorizadoController],
      providers: [AsientoMayorizadoService],
    }).compile();

    controller = module.get<AsientoMayorizadoController>(AsientoMayorizadoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
