import { Test, TestingModule } from '@nestjs/testing'
import { TipoCambioHistService } from './tipo-cambio-hist.service'

describe('TipoCambioHistService', () => {
  let service: TipoCambioHistService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoCambioHistService],
    }).compile()

    service = module.get<TipoCambioHistService>(TipoCambioHistService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
