import { Test, TestingModule } from '@nestjs/testing'
import { CentrocostoService } from './centrocosto.service'

describe('CentrocostoService', () => {
  let service: CentrocostoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CentrocostoService],
    }).compile()

    service = module.get<CentrocostoService>(CentrocostoService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
