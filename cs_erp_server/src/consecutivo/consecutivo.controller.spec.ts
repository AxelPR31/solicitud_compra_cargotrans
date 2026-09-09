import { Test, TestingModule } from '@nestjs/testing'
import { ConsecutivoController } from './consecutivo.controller'
import { ConsecutivoService } from './consecutivo.service'

describe('ConsecutivoController', () => {
  let controller: ConsecutivoController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsecutivoController],
      providers: [ConsecutivoService],
    }).compile()

    controller = module.get<ConsecutivoController>(ConsecutivoController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
