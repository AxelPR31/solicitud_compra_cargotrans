import { Test, TestingModule } from '@nestjs/testing'
import { MovBancosService } from './mov-bancos.service'

describe('MovBancosService', () => {
  let service: MovBancosService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MovBancosService],
    }).compile()

    service = module.get<MovBancosService>(MovBancosService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
