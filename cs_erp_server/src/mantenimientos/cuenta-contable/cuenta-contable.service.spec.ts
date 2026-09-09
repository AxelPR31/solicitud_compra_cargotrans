import { Test, TestingModule } from '@nestjs/testing'
import { CuentacontableService } from './cuenta-contable.service'

describe('CuentacontableService', () => {
  let service: CuentacontableService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CuentacontableService],
    }).compile()

    service = module.get<CuentacontableService>(CuentacontableService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
