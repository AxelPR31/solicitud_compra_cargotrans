import { Test, TestingModule } from '@nestjs/testing'
import { ImpuestoController } from './impuesto.controller'
import { ImpuestoService } from './impuesto.service'

describe('ImpuestoController', () => {
  let controller: ImpuestoController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImpuestoController],
      providers: [ImpuestoService],
    }).compile()

    controller = module.get<ImpuestoController>(ImpuestoController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
