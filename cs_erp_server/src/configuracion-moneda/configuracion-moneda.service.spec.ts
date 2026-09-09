import { Test, TestingModule } from '@nestjs/testing'
import { ConfiguracionMonedaService } from './configuracion-moneda.service'

describe('ConfiguracionMonedaService', () => {
  let service: ConfiguracionMonedaService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfiguracionMonedaService],
    }).compile()

    service = module.get<ConfiguracionMonedaService>(ConfiguracionMonedaService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
