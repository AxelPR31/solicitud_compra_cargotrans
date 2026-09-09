import { Test, TestingModule } from '@nestjs/testing'
import { ConsecutivoService } from './consecutivo.service'

describe('ConsecutivoService', () => {
  let service: ConsecutivoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsecutivoService],
    }).compile()

    service = module.get<ConsecutivoService>(ConsecutivoService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
