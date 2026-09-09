import { Test, TestingModule } from '@nestjs/testing'
import { CuentacontableController } from './cuenta-contable.controller'
import { CuentacontableService } from './cuenta-contable.service'

describe('CuentacontableController', () => {
  let controller: CuentacontableController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CuentacontableController],
      providers: [CuentacontableService],
    }).compile()

    controller = module.get<CuentacontableController>(CuentacontableController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
