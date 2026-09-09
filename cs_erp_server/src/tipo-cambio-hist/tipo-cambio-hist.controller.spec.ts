import { Test, TestingModule } from '@nestjs/testing'
import { TipoCambioHistController } from './tipo-cambio-hist.controller'
import { TipoCambioHistService } from './tipo-cambio-hist.service'

describe('TipoCambioHistController', () => {
  let controller: TipoCambioHistController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoCambioHistController],
      providers: [TipoCambioHistService],
    }).compile()

    controller = module.get<TipoCambioHistController>(TipoCambioHistController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
