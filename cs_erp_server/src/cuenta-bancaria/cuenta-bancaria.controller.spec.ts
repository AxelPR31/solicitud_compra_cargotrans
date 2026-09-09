import { Test, TestingModule } from '@nestjs/testing'
import { CuentaBancariaController } from './cuenta-bancaria.controller'
import { CuentaBancariaService } from './cuenta-bancaria.service'

describe('CuentaBancariaController', () => {
  let controller: CuentaBancariaController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CuentaBancariaController],
      providers: [CuentaBancariaService],
    }).compile()

    controller = module.get<CuentaBancariaController>(CuentaBancariaController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
