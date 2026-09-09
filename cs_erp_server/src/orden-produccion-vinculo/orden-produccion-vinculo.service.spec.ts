import { Test, TestingModule } from '@nestjs/testing'
import { OrdenProduccionVinculoService } from './orden-produccion-vinculo.service'
import { TENANT_CONENCTION } from '../tenant/tenant.module'

describe('OrdenProduccionVinculoService - calcular', () => {
  let service: OrdenProduccionVinculoService

  beforeEach(async () => {
    const mockDataSource = {
      getRepository: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdenProduccionVinculoService,
        {
          provide: TENANT_CONENCTION,
          useValue: mockDataSource,
        },
      ],
    }).compile()

    service = module.get<OrdenProduccionVinculoService>(OrdenProduccionVinculoService)
  })

  it('debería calcular correctamente según la lógica del Excel real (Caso de Prueba)', () => {
    const dto = {
      materiaPrima: {
        articulo: 'CARN0001',
        cantidad: 249.09,
        costoUnitario: 326.12
      },
      productos: [
        { articulo: 'TERM0008', cantidadUnitaria: 30, cantidadLibra: 23.70, esMermaRecorte: false },
        { articulo: 'TERM0010', cantidadUnitaria: 44, cantidadLibra: 26.55, esMermaRecorte: false },
        { articulo: 'TERM0009', cantidadUnitaria: 34, cantidadLibra: 18.25, esMermaRecorte: false },
        { articulo: 'TERM0024', cantidadUnitaria: 23, cantidadLibra: 15.40, esMermaRecorte: false },
        { articulo: 'TERM0025', cantidadUnitaria: 55, cantidadLibra: 36.70, esMermaRecorte: false },
        { articulo: 'TERM0009', cantidadUnitaria: 35, cantidadLibra: 18.70, esMermaRecorte: false },
        { articulo: 'TERM0007', cantidadUnitaria: 41, cantidadLibra: 17.15, esMermaRecorte: false },
        { articulo: 'TERM0002', cantidadUnitaria: 18, cantidadLibra: 6.20, esMermaRecorte: false },
        { articulo: 'TERM0058', cantidadUnitaria: 151, cantidadLibra: 44.60, esMermaRecorte: false },
        { articulo: 'TERM0012', cantidadUnitaria: 24, cantidadLibra: 6.50, esMermaRecorte: false },
        { articulo: 'TERM0059', cantidadUnitaria: 0, cantidadLibra: 0, esMermaRecorte: true },
        { articulo: 'TERM0094', cantidadUnitaria: 0, cantidadLibra: 30.65, esMermaRecorte: true }
      ],
      factors: [
        { articulo: 'TERM0094', factor: 0.20 }
      ]
    }

    const res = service.calcular(dto)

    // Assertions based on section 4 results
    expect(res.totalCostoMP).toBeCloseTo(81233.23, 2)
    expect(res.totalCostoSubproducts).toBeCloseTo(1999.12, 2)
    expect(res.nuevoCostoLibraMain).toBeCloseTo(370.6859, 4)
    expect(res.mermaLibras).toBeCloseTo(35.34, 2)
    expect(res.mermaPorcentaje).toBeCloseTo(14.19, 2)
    expect(res.balance).toBeCloseTo(0, 2)

    const churrasco12 = res.productos.find(p => p.articulo === 'TERM0008')
    expect(churrasco12).toBeDefined()
    expect(churrasco12.costoTotal).toBeCloseTo(8785.26, 2)
    expect(churrasco12.nuevoCostoUnitario).toBeCloseTo(8785.26 / 30, 2)
  })
})
