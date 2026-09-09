import { Test, TestingModule } from '@nestjs/testing'
import { ImpuestoService } from './impuesto.service'

describe('ImpuestoService', () => {
  let service: ImpuestoService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImpuestoService],
    }).compile()

    service = module.get<ImpuestoService>(ImpuestoService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
