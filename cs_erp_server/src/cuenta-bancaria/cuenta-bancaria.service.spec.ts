import { Test, TestingModule } from '@nestjs/testing'
import { CuentaBancariaService } from './cuenta-bancaria.service'

describe('CuentaBancariaService', () => {
  let service: CuentaBancariaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CuentaBancariaService],
    }).compile()

    service = module.get<CuentaBancariaService>(CuentaBancariaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
