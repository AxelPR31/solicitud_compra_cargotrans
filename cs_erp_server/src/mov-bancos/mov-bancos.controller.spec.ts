import { Test, TestingModule } from '@nestjs/testing'
import { MovBancosController } from './mov-bancos.controller'
import { MovBancosService } from './mov-bancos.service'

describe('MovBancosController', () => {
  let controller: MovBancosController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovBancosController],
      providers: [MovBancosService],
    }).compile()

    controller = module.get<MovBancosController>(MovBancosController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
