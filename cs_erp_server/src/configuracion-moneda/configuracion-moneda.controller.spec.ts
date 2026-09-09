import { Test, TestingModule } from '@nestjs/testing'
import { ConfiguracionMonedaController } from './configuracion-moneda.controller'
import { ConfiguracionMonedaService } from './configuracion-moneda.service'

describe('ConfiguracionMonedaController', () => {
  let controller: ConfiguracionMonedaController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfiguracionMonedaController],
      providers: [ConfiguracionMonedaService],
    }).compile()

    controller = module.get<ConfiguracionMonedaController>(
      ConfiguracionMonedaController,
    )
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })
})
