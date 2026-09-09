import { Test, TestingModule } from '@nestjs/testing'
import { CentrocostoController } from './centrocosto.controller'
import { CentrocostoService } from './centrocosto.service'

describe('CentrocostoController', () => {
  let controller: CentrocostoController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CentrocostoController],
      providers: [CentrocostoService],
    }).compile()

    controller = module.get<CentrocostoController>(CentrocostoController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
