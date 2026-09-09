import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { OrdenProduccionVinculo } from './entities/orden-produccion-vinculo.entity'
import { OrdenProduccionDetalle } from './entities/orden-produccion-detalle.entity'
import { OrdenProduccionMateriaPrima } from './entities/orden-produccion-materia-prima.entity'
import { FactorValuacion } from '../factor-valuacion/entities/factor-valuacion.entity'
import { CreateOrdenProduccionVinculoDto } from './dto/create-orden-produccion-vinculo.dto'
import { UpdateOrdenProduccionVinculoDto } from './dto/update-orden-produccion-vinculo.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { Articulo } from '../articulo/entities/articulo.entity'
import { UnidadDeMedida } from '../unidad-de-medida/entities/unidad-de-medida.entity'
import { ConsecutivoAppConsumoService } from '../consecutivo-app-consumo/consecutivo-app-consumo.service'
import { DocumentoInv } from '../documento-inv/entities/documento-inv.entity'
import { LineaDocInv } from '../linea-doc-inv/entities/linea-doc-inv.entity'
import { AjusteConfig } from '../ajuste-config/entities/ajuste-config.entity'
import { TipoCambioHist } from '../tipo-cambio-hist/entities/tipo-cambio-hist.entity'

@Injectable()
export class OrdenProduccionVinculoService {
  private repository: Repository<OrdenProduccionVinculo>

  constructor(
    @Inject(TENANT_CONENCTION) private dataSource: DataSource,
    private readonly consecutivoAppConsumoService: ConsecutivoAppConsumoService,
  ) {
    this.repository = dataSource.getRepository(OrdenProduccionVinculo)
  }

  async create(createOrdenProduccionVinculoDto: CreateOrdenProduccionVinculoDto) {
    const { detalles, materiasPrimas, ...headerData } = createOrdenProduccionVinculoDto

    if (!headerData.bodega) {
      throw new BadRequestException('La bodega es requerida')
    }

    if (!headerData.elaboradoPor) {
      headerData.elaboradoPor = ''
    }

    // Fetch valuation factors from database
    const factorsRepo = this.dataSource.getRepository(FactorValuacion)
    const dbFactors = await factorsRepo.find()

    // Fetch articles from database to validate units of measure
    const articulosRepo = this.dataSource.getRepository(Articulo)
    const articleCodes = detalles.map(d => d.articulo).filter(Boolean)
    
    let articulosMap = new Map<string, Articulo>()
    if (articleCodes.length > 0) {
      const dbArticulos = await articulosRepo.createQueryBuilder('a')
        .where('a.articulo IN (:...articleCodes)', { articleCodes })
        .getMany()
      dbArticulos.forEach(art => articulosMap.set(art.articulo, art))
    }

    // Fetch units of measure to check if any of them contains 'libra' in their description
    let unidadesLbsCodes = new Set<string>()
    try {
      const unidadesRepo = this.dataSource.getRepository(UnidadDeMedida)
      const dbUnidades = await unidadesRepo.find()
      dbUnidades
        .filter(u => {
          const desc = (u.descripcion || '').toUpperCase()
          return desc.includes('LIBRA') || desc.includes('LBS')
        })
        .forEach(u => unidadesLbsCodes.add(u.unidadMedida.toUpperCase()))
    } catch (err) {
      console.error('Error fetching units of measure in backend validation', err)
    }

    // Validate details based on their unidadAlmacen only if they are not completely empty
    for (const d of detalles) {
      const hasQty = Number(d.cantidadLibra || 0) > 0 || Number(d.cantidadUnitaria || 0) > 0
      if (!hasQty) continue

      const art = articulosMap.get(d.articulo)
      if (!art) continue

      const isLbs = d.esMermaRecorte || 
                    (art.unidadAlmacen && (
                      art.unidadAlmacen.toUpperCase() === 'LBS' || 
                      art.unidadAlmacen.toUpperCase() === 'LB' || 
                      unidadesLbsCodes.has(art.unidadAlmacen.toUpperCase())
                    ))
      if (isLbs) {
        if (Number(d.cantidadLibra) <= 0) {
          throw new BadRequestException(
            `El artículo ${d.articulo} (${art.descripcion}) está configurado en Libras, por lo que requiere una cantidad en libras mayor a cero.`
          )
        }
      } else {
        if (Number(d.cantidadUnitaria) <= 0) {
          throw new BadRequestException(
            `El artículo ${d.articulo} (${art.descripcion}) está configurado en Unidades, por lo que requiere una cantidad unitaria mayor a cero.`
          )
        }
      }
    }

    const listMP = materiasPrimas || (headerData.materiaPrima ? [{
      articulo: headerData.materiaPrima,
      cantidad: Number(headerData.pesoMateriaPrima || 0),
      costoUnitario: Number(headerData.costoUnitarioMateriaPrima || 0)
    }] : [])

    // Validate calculations and balance (Cuadre Paso 9)
    const calc = this.calcular({
      materiasPrimas: listMP,
      productos: detalles.map(d => ({
        articulo: d.articulo,
        cantidadUnitaria: Number(d.cantidadUnitaria),
        cantidadLibra: Number(d.cantidadLibra),
        esMermaRecorte: !!d.esMermaRecorte
      })),
      factors: dbFactors
    })

    if (Math.abs(calc.balance) > 0.05) {
      throw new BadRequestException(
        `No se puede procesar la orden: El balance financiero tiene un descuadre de $${calc.balance.toFixed(4)} (Consumo vs Entrada).`
      )
    }

    // Overwrite header and details data with backend calculations to ensure precision and correctness
    if (listMP.length > 0) {
      headerData.materiaPrima = listMP[0].articulo
      headerData.pesoMateriaPrima = calc.totalLibrasMP
      headerData.costoUnitarioMateriaPrima = calc.promedioUnitarioMP
    }
    headerData.totalCosto = calc.totalCostoMP
    headerData.totalLibras = calc.totalLibrasProducidas
    headerData.mermaLibras = calc.mermaLibras
    headerData.mermaPorcentaje = calc.mermaPorcentaje

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      if (!headerData.numeroDocumento || headerData.numeroDocumento === 'AUTO') {
        const nextDocNum = await this.consecutivoAppConsumoService.obtenerSiguiente('ORDEN_PRODUCCION', queryRunner.manager)
        headerData.numeroDocumento = nextDocNum
      }

      const header = queryRunner.manager.create(OrdenProduccionVinculo, headerData)
      const savedHeader = await queryRunner.manager.save(header)

      if (listMP.length > 0) {
        const mpRepo = queryRunner.manager.getRepository(OrdenProduccionMateriaPrima)
        const mpEntities = listMP.map(mp => {
          return mpRepo.create({
            vinculoId: savedHeader.id,
            articulo: mp.articulo,
            cantidad: Number(mp.cantidad),
            costoUnitario: Number(mp.costoUnitario),
            costoTotal: Number(mp.cantidad) * Number(mp.costoUnitario)
          })
        })
        await queryRunner.manager.save(mpEntities)
      }

      if (detalles && detalles.length > 0) {
        const detailsEntities = detalles.map((d, index) => {
          const calcProd = calc.productos[index]
          const { id, ...detailData } = d as any
          return queryRunner.manager.create(OrdenProduccionDetalle, {
            ...detailData,
            nuevoCostoUnitario: calcProd.nuevoCostoUnitario ?? 0,
            nuevoCostoLibra: calcProd.nuevoCostoLibra ?? 0,
            costoTotal: calcProd.costoTotal,
            asignacionCosto: calcProd.asignacionCosto,
            vinculoId: savedHeader.id,
          })
        })
        await queryRunner.manager.save(detailsEntities)
      }

      // --- ATOMIC SOFTLAND INSERTIONS ---
      const packageCode = process.env.PROD_PAQUETE || 'TRAN'
      const consecutiveCode = process.env.PROD_CONSECUTIVO || 'TRANS'

      if (headerData.documentoConsumo) {
        // Fetch latest exchange rate
        let exchangeRate = 8.5
        try {
          const latestRateRow = await queryRunner.manager.getRepository(TipoCambioHist).findOne({
            where: { tipo: 'OFIC' },
            order: { fecha: 'DESC' },
          })
          if (latestRateRow && latestRateRow.monto) {
            exchangeRate = Number(latestRateRow.monto)
          }
        } catch (err) {
          console.error('Error fetching latest exchange rate from TIPO_CAMBIO_HIST', err)
        }

        // Fetch dynamic adjustment configurations
        const ajusteConfigRepo = queryRunner.manager.getRepository(AjusteConfig)
        let consumoAjusteConfig = 'CONSUMO'
        let entradaAjusteConfig = 'ENTRADA'
        try {
          const cConfig = await ajusteConfigRepo.findOneBy({ ajusteBase: 'C' })
          if (cConfig && cConfig.ajusteConfig) {
            consumoAjusteConfig = cConfig.ajusteConfig
          }
          const oConfig = await ajusteConfigRepo.findOneBy({ ajusteBase: 'O' })
          if (oConfig && oConfig.ajusteConfig) {
            entradaAjusteConfig = oConfig.ajusteConfig
          }
        } catch (err) {
          console.error('Error fetching dynamic ajusteConfig values from database', err)
        }

        // Create Softland Document Header
        const softlandHeader = queryRunner.manager.create(DocumentoInv, {
          paqueteInventario: packageCode,
          documentoInv: headerData.documentoConsumo,
          consecutivo: consecutiveCode,
          referencia: headerData.referencia || `OP - MP: ${headerData.materiaPrima}`,
          fechaDocumento: headerData.fecha,
          fechaHorCreacion: new Date(),
          seleccionado: 'N',
          usuario: headerData.elaboradoPor?.toUpperCase() || ''
        })
        await queryRunner.manager.save(softlandHeader)

        // Create Lineas Consumo (Softland) - Line 1 to M
        let lineIndex = 1
        for (const mp of listMP) {
          const softlandLineC = queryRunner.manager.create(LineaDocInv, {
            paqueteInventario: packageCode,
            documentoInv: headerData.documentoConsumo,
            lineaDocInv: lineIndex++,
            nit: null,
            articulo: mp.articulo,
            bodega: headerData.bodega,
            localizacion: null,
            lote: null,
            tipo: 'C',
            subtipo: 'D',
            subsubtipo: 'N',
            ajusteConfig: consumoAjusteConfig,
            cantidad: Number(mp.cantidad),
            costoTotalLocal: 0,
            costoTotalDolar: 0,
            precioTotalLocal: 0,
            precioTotalDolar: 0,
            bodegaDestino: '',
            centroCosto: null,
            cuentaContable: null,
            costoTotalLocalComp: 0,
            costoTotalDolarComp: 0
          })
          await queryRunner.manager.save(softlandLineC)
        }

        // Create Lineas Entrada (Softland) - Lines M+1 to M+N
        if (detalles && detalles.length > 0) {
          for (let i = 0; i < detalles.length; i++) {
            const d = detalles[i]
            const calcProd = calc.productos[i]

            const art = articulosMap.get(d.articulo)
            const isLbs = d.esMermaRecorte ||
                          (art?.unidadAlmacen && (
                            art.unidadAlmacen.toUpperCase() === 'LBS' ||
                            art.unidadAlmacen.toUpperCase() === 'LB' ||
                            unidadesLbsCodes.has(art.unidadAlmacen.toUpperCase())
                          ))
            const qty = isLbs ? Number(d.cantidadLibra) : Number(d.cantidadUnitaria)
            if (qty <= 0) continue

            const unitCost = isLbs ? calcProd.nuevoCostoLibra : calcProd.nuevoCostoUnitario

            const softlandLineN = queryRunner.manager.create(LineaDocInv, {
              paqueteInventario: packageCode,
              documentoInv: headerData.documentoConsumo,
              lineaDocInv: lineIndex++,
              nit: null,
              articulo: d.articulo,
              bodega: d.bodega || headerData.bodega,
              localizacion: null,
              lote: null,
              tipo: 'O',
              subtipo: 'D',
              subsubtipo: 'L',
              ajusteConfig: entradaAjusteConfig,
              cantidad: qty,
              costoTotalLocal: Number(unitCost),
              costoTotalDolar: Number((unitCost / exchangeRate).toFixed(8)),
              precioTotalLocal: 0,
              precioTotalDolar: 0,
              bodegaDestino: '',
              centroCosto: null,
              cuentaContable: null,
              costoTotalLocalComp: Number(unitCost),
              costoTotalDolarComp: Number((unitCost / exchangeRate).toFixed(8))
            })
            await queryRunner.manager.save(softlandLineN)
          }
        }
      }

      await queryRunner.commitTransaction()
      return this.findOne(savedHeader.id)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 1000, offset = 0 } = paginationDto
    const list = await this.repository.find({
      take: limit,
      skip: offset,
      order: { fecha: 'DESC', id: 'DESC' },
    })

    // Fetch all raw materials for all vinculos in the list to support multiple raw materials
    const vinculoIds = list.map(o => o.id)
    const materiasPrimasMap = new Map<number, any[]>()
    const allMateriaPrimaCodes = new Set<string>()

    if (vinculoIds.length > 0) {
      const mpRepo = this.dataSource.getRepository(OrdenProduccionMateriaPrima)
      const dbMps = await mpRepo.createQueryBuilder('mp')
        .where('mp.vinculoId IN (:...vinculoIds)', { vinculoIds })
        .getMany()

      dbMps.forEach(mp => {
        allMateriaPrimaCodes.add(mp.articulo)
        if (!materiasPrimasMap.has(mp.vinculoId)) {
          materiasPrimasMap.set(mp.vinculoId, [])
        }
        materiasPrimasMap.get(mp.vinculoId).push(mp)
      })
    }

    // Fetch descriptions for all unique raw materials in the list (legacy single field + new multiple list)
    const articulosRepo = this.dataSource.getRepository(Articulo)
    const codes = Array.from(new Set([
      ...list.map(o => o.materiaPrima).filter(Boolean),
      ...Array.from(allMateriaPrimaCodes)
    ]))
    
    let articulosMap = new Map<string, string>()
    if (codes.length > 0) {
      const dbArticulos = await articulosRepo.createQueryBuilder('a')
        .where('a.articulo IN (:...codes)', { codes })
        .getMany()
      dbArticulos.forEach(art => articulosMap.set(art.articulo, art.descripcion))
    }

    // Fetch references from DOCUMENTO_INV
    const docInvCodes = Array.from(new Set(list.map(o => o.documentoConsumo).filter(Boolean)))
    let referenciaMap = new Map<string, string>()
    if (docInvCodes.length > 0) {
      const docInvRepo = this.dataSource.getRepository(DocumentoInv)
      const docs = await docInvRepo.createQueryBuilder('d')
        .where('d.documentoInv IN (:...docInvCodes)', { docInvCodes })
        .getMany()
      docs.forEach(d => referenciaMap.set(d.documentoInv, d.referencia))
    }

    return Promise.all(list.map(async vinculo => {
      const mps = materiasPrimasMap.get(vinculo.id) || []
      let finalMps = mps.map(mp => ({
        ...mp,
        nombre: articulosMap.get(mp.articulo) || 'N/A'
      }))

      // Fallback: if no records exist in CS_ORDEN_PRODUCCION_MATERIA_PRIMA, build one based on the header's legacy fields
      if (finalMps.length === 0 && vinculo.materiaPrima) {
        finalMps = [{
          id: 0,
          vinculoId: vinculo.id,
          articulo: vinculo.materiaPrima,
          cantidad: Number(vinculo.pesoMateriaPrima || 0),
          costoUnitario: Number(vinculo.costoUnitarioMateriaPrima || 0),
          costoTotal: Number(vinculo.pesoMateriaPrima || 0) * Number(vinculo.costoUnitarioMateriaPrima || 0),
          nombre: articulosMap.get(vinculo.materiaPrima) || 'N/A'
        }] as any
      }

      let referencia = vinculo.referencia
      if (!referencia && vinculo.documentoConsumo) {
        referencia = referenciaMap.get(vinculo.documentoConsumo) || null
        if (!referencia) {
          referencia = await this.buscarReferenciaHistorica(vinculo.documentoConsumo)
        }
      }

      return {
        ...vinculo,
        materiaPrimaNombre: vinculo.materiaPrima ? articulosMap.get(vinculo.materiaPrima) : null,
        referencia,
        materiasPrimas: finalMps
      }
    }))
  }

  async findOne(id: number) {
    const vinculo = await this.repository.findOneBy({ id })
    if (vinculo) {
      const detailsRepository = this.dataSource.getRepository(OrdenProduccionDetalle)
      const detalles = await detailsRepository.find({
        where: { vinculoId: id },
      })

      // Fetch all raw materials for this order
      const mpRepo = this.dataSource.getRepository(OrdenProduccionMateriaPrima)
      const dbMps = await mpRepo.find({ where: { vinculoId: id } })

      let materiasPrimas = dbMps
      if (dbMps.length === 0 && vinculo.materiaPrima) {
        materiasPrimas = [{
          id: 0,
          vinculoId: id,
          articulo: vinculo.materiaPrima,
          cantidad: Number(vinculo.pesoMateriaPrima || 0),
          costoUnitario: Number(vinculo.costoUnitarioMateriaPrima || 0),
          costoTotal: Number(vinculo.pesoMateriaPrima || 0) * Number(vinculo.costoUnitarioMateriaPrima || 0)
        }] as any
      }

      // Fetch all article descriptions in one go
      const articulosRepo = this.dataSource.getRepository(Articulo)
      const codes = Array.from(new Set([
        ...materiasPrimas.map(mp => mp.articulo),
        ...detalles.map(d => d.articulo)
      ].filter(Boolean)))
      
      let articulosMap = new Map<string, string>()
      if (codes.length > 0) {
        const dbArticulos = await articulosRepo.createQueryBuilder('a')
          .where('a.articulo IN (:...codes)', { codes })
          .getMany()
        dbArticulos.forEach(art => articulosMap.set(art.articulo, art.descripcion))
      }

      const materiasPrimasConNombre = materiasPrimas.map(mp => ({
        ...mp,
        nombre: articulosMap.get(mp.articulo) || 'N/A'
      }))

      const materiaPrimaNombre = vinculo.materiaPrima ? articulosMap.get(vinculo.materiaPrima) : null
      
      // Fetch Softland lines to extract warehouses (bodega)
      let bodega = '01'
      let lineasDocInv: LineaDocInv[] = []
      if (vinculo.documentoConsumo) {
        try {
          const ajusteConfigRepo = this.dataSource.getRepository(AjusteConfig)
          let consumoAjusteConfig = 'CONSUMO'
          try {
            const cConfig = await ajusteConfigRepo.findOneBy({ ajusteBase: 'C' })
            if (cConfig && cConfig.ajusteConfig) {
              consumoAjusteConfig = cConfig.ajusteConfig.trim()
            }
          } catch (err) {
            console.error('Error fetching dynamic consumoAjusteConfig from database', err)
          }

          const lineaDocInvRepo = this.dataSource.getRepository(LineaDocInv)
          lineasDocInv = await lineaDocInvRepo.find({
            where: { documentoInv: vinculo.documentoConsumo }
          })
          const consumoLine = lineasDocInv.find(l => l.ajusteConfig?.trim() === consumoAjusteConfig)
          if (consumoLine) {
            bodega = consumoLine.bodega?.trim()
          }
        } catch (err) {
          console.error('Error fetching LINEA_DOC_INV lines to get bodegas', err)
        }
      }

      const mappedDetalles = detalles.map(d => {
        const matchingLine = lineasDocInv.find(
          l => l.articulo?.trim() === d.articulo?.trim() && 
               l.ajusteConfig?.trim() !== 'CONSUMO' && 
               l.ajusteConfig?.trim() !== '~CC~'
        )
        return {
          ...d,
          nombre: articulosMap.get(d.articulo) || d.nombre || 'N/A',
          bodega: matchingLine ? matchingLine.bodega?.trim() : bodega
        }
      })

      // Fetch Softland reference and check if it is editable
      let referencia = vinculo.referencia
      let editable = false
      if (vinculo.documentoConsumo) {
        const packageCode = process.env.PROD_PAQUETE || 'TRAN'
        const docInvRepo = this.dataSource.getRepository(DocumentoInv)
        const docInv = await docInvRepo.findOneBy({
          paqueteInventario: packageCode,
          documentoInv: vinculo.documentoConsumo
        })
        if (docInv) {
          referencia = docInv.referencia || referencia
          editable = true
        } else {
          // Try to find it globally in DOCUMENTO_INV (any package)
          const docInvGlobal = await docInvRepo.findOneBy({
            documentoInv: vinculo.documentoConsumo
          })
          if (docInvGlobal) {
            referencia = docInvGlobal.referencia || referencia
            editable = false
          } else if (!referencia) {
            // Fallback: search in posted history tables of Softland
            referencia = await this.buscarReferenciaHistorica(vinculo.documentoConsumo)
          }
        }
      }

      return {
        ...vinculo,
        materiaPrimaNombre,
        referencia,
        bodega,
        materiasPrimas: materiasPrimasConNombre,
        detalles: mappedDetalles,
        editable,
      }
    }
    return null
  }

  async update(
    id: number,
    updateOrdenProduccionVinculoDto: UpdateOrdenProduccionVinculoDto,
  ) {
    const existing = await this.repository.findOneBy({ id })
    if (!existing) {
      throw new NotFoundException(`Orden de producción con ID ${id} no encontrada`)
    }

    // Verify if the Softland document is still open/pending (exists in DOCUMENTO_INV)
    if (existing.documentoConsumo) {
      const packageCode = process.env.PROD_PAQUETE || 'TRAN'
      const docInvRepo = this.dataSource.getRepository(DocumentoInv)
      const docInv = await docInvRepo.findOneBy({
        paqueteInventario: packageCode,
        documentoInv: existing.documentoConsumo
      })
      if (!docInv) {
        throw new BadRequestException(
          `No se puede modificar esta orden de producción porque el documento correspondiente (${existing.documentoConsumo}) ya fue aprobado/aplicado o eliminado en Softland.`
        )
      }
    }

    // Fetch the existing bodega from Softland
    let existingBodega = ''
    if (existing.documentoConsumo) {
      const packageCode = process.env.PROD_PAQUETE || 'TRAN'
      const lineaRepo = this.dataSource.getRepository(LineaDocInv)
      const line = await lineaRepo.findOneBy({
        documentoInv: existing.documentoConsumo,
        paqueteInventario: packageCode,
        lineaDocInv: 1
      })
      if (line) {
        existingBodega = line.bodega
      }
    }

    const { detalles, materiasPrimas, ...headerData } = updateOrdenProduccionVinculoDto

    const mergedBodega = headerData.bodega !== undefined ? headerData.bodega : existingBodega
    if (!mergedBodega) {
      throw new BadRequestException('La bodega es requerida y no fue encontrada.')
    }

    const mergedMateriaPrima = headerData.materiaPrima !== undefined ? headerData.materiaPrima : existing.materiaPrima
    const mergedPesoMateriaPrima = headerData.pesoMateriaPrima !== undefined ? headerData.pesoMateriaPrima : existing.pesoMateriaPrima
    const mergedCostoUnitarioMateriaPrima = headerData.costoUnitarioMateriaPrima !== undefined ? headerData.costoUnitarioMateriaPrima : existing.costoUnitarioMateriaPrima
    const mergedReferencia = headerData.referencia !== undefined ? headerData.referencia : existing.referencia

    let articulosMap = new Map<string, Articulo>()
    let unidadesLbsCodes = new Set<string>()

    // Fetch list of raw materials
    let listMP = materiasPrimas
    if (!listMP) {
      const mpRepo = this.dataSource.getRepository(OrdenProduccionMateriaPrima)
      const dbMps = await mpRepo.find({ where: { vinculoId: id } })
      if (dbMps.length > 0) {
        listMP = dbMps.map(mp => ({
          articulo: mp.articulo,
          cantidad: mp.cantidad,
          costoUnitario: mp.costoUnitario
        }))
      } else {
        listMP = [{
          articulo: mergedMateriaPrima,
          cantidad: Number(mergedPesoMateriaPrima || 0),
          costoUnitario: Number(mergedCostoUnitarioMateriaPrima || 0)
        }]
      }
    }

    // If details are provided, we should run the calculations and validations
    let calc: any = null
    if (detalles) {
      // Fetch valuation factors from database
      const factorsRepo = this.dataSource.getRepository(FactorValuacion)
      const dbFactors = await factorsRepo.find()

      // Fetch articles from database to validate units of measure
      const articulosRepo = this.dataSource.getRepository(Articulo)
      const articleCodes = detalles.map(d => d.articulo).filter(Boolean)

      if (articleCodes.length > 0) {
        const dbArticulos = await articulosRepo.createQueryBuilder('a')
          .where('a.articulo IN (:...articleCodes)', { articleCodes })
          .getMany()
        dbArticulos.forEach(art => articulosMap.set(art.articulo, art))
      }

      // Fetch units of measure
      try {
        const unidadesRepo = this.dataSource.getRepository(UnidadDeMedida)
        const dbUnidades = await unidadesRepo.find()
        dbUnidades
          .filter(u => {
            const desc = (u.descripcion || '').toUpperCase()
            return desc.includes('LIBRA') || desc.includes('LBS')
          })
          .forEach(u => unidadesLbsCodes.add(u.unidadMedida.toUpperCase()))
      } catch (err) {
        console.error('Error fetching units of measure in backend validation', err)
      }

      // Validate details based on their unidadAlmacen only if they are not completely empty
      for (const d of detalles) {
        const hasQty = Number(d.cantidadLibra || 0) > 0 || Number(d.cantidadUnitaria || 0) > 0
        if (!hasQty) continue

        const art = articulosMap.get(d.articulo)
        if (!art) continue

        const isLbs = d.esMermaRecorte ||
                      (art.unidadAlmacen && (
                        art.unidadAlmacen.toUpperCase() === 'LBS' ||
                        art.unidadAlmacen.toUpperCase() === 'LB' ||
                        unidadesLbsCodes.has(art.unidadAlmacen.toUpperCase())
                      ))
        if (isLbs) {
          if (Number(d.cantidadLibra) <= 0) {
            throw new BadRequestException(
              `El artículo ${d.articulo} (${art.descripcion}) está configurado en Libras, por lo que requiere una cantidad en libras mayor a cero.`
            )
          }
        } else {
          if (Number(d.cantidadUnitaria) <= 0) {
            throw new BadRequestException(
              `El artículo ${d.articulo} (${art.descripcion}) está configurado en Unidades, por lo que requiere una cantidad unitaria mayor a cero.`
            )
          }
        }
      }

      // Validate calculations and balance (Cuadre Paso 9)
      calc = this.calcular({
        materiasPrimas: listMP,
        productos: detalles.map(d => ({
          articulo: d.articulo,
          cantidadUnitaria: Number(d.cantidadUnitaria),
          cantidadLibra: Number(d.cantidadLibra),
          esMermaRecorte: !!d.esMermaRecorte
        })),
        factors: dbFactors
      })

      if (Math.abs(calc.balance) > 0.05) {
        throw new BadRequestException(
          `No se puede procesar la orden: El balance financiero tiene un descuadre de $${calc.balance.toFixed(4)} (Consumo vs Entrada).`
        )
      }

      // Overwrite header with backend calculations to ensure precision
      if (listMP.length > 0) {
        headerData.materiaPrima = listMP[0].articulo
        headerData.pesoMateriaPrima = calc.totalLibrasMP
        headerData.costoUnitarioMateriaPrima = calc.promedioUnitarioMP
      }
      headerData.totalCosto = calc.totalCostoMP
      headerData.totalLibras = calc.totalLibrasProducidas
      headerData.mermaLibras = calc.mermaLibras
      headerData.mermaPorcentaje = calc.mermaPorcentaje
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Update header (excluyendo explícitamente los campos ajenos a la entidad, que ahora incluye referencia)
      const { bodega, ...updateData } = headerData
      await queryRunner.manager.update(OrdenProduccionVinculo, id, updateData)

      // 2. Clean and recreate raw materials detailed list
      if (listMP) {
        const mpRepo = queryRunner.manager.getRepository(OrdenProduccionMateriaPrima)
        await mpRepo.delete({ vinculoId: id })
        if (listMP.length > 0) {
          const mpEntities = listMP.map(mp => {
            return mpRepo.create({
              vinculoId: id,
              articulo: mp.articulo,
              cantidad: Number(mp.cantidad),
              costoUnitario: Number(mp.costoUnitario),
              costoTotal: Number(mp.cantidad) * Number(mp.costoUnitario)
            })
          })
          await mpRepo.save(mpEntities)
        }
      }

      // 3. Update details if provided
      if (detalles && calc) {
        // Delete old details
        await queryRunner.manager.delete(OrdenProduccionDetalle, { vinculoId: id })

        // Create new details
        const detailsEntities = detalles.map((d, index) => {
          const calcProd = calc.productos[index]
          const { id: dummyId, ...detailData } = d as any
          return queryRunner.manager.create(OrdenProduccionDetalle, {
            ...detailData,
            nuevoCostoUnitario: calcProd.nuevoCostoUnitario ?? 0,
            nuevoCostoLibra: calcProd.nuevoCostoLibra ?? 0,
            costoTotal: calcProd.costoTotal,
            asignacionCosto: calcProd.asignacionCosto,
            vinculoId: id,
          })
        })
        await queryRunner.manager.save(detailsEntities)

        // --- ATOMIC SOFTLAND UPDATE ---
        if (existing.documentoConsumo) {
          const packageCode = process.env.PROD_PAQUETE || 'TRAN'

          // Delete old Softland document lines
          await queryRunner.manager.delete(LineaDocInv, {
            paqueteInventario: packageCode,
            documentoInv: existing.documentoConsumo
          })

          // Update Softland Document Header
          await queryRunner.manager.update(DocumentoInv,
            { paqueteInventario: packageCode, documentoInv: existing.documentoConsumo },
            {
              referencia: mergedReferencia || `OP - MP: ${headerData.materiaPrima || mergedMateriaPrima}`,
              fechaDocumento: headerData.fecha || existing.fecha,
              usuario: headerData.elaboradoPor?.toUpperCase() || existing.elaboradoPor?.toUpperCase() || 'CS_ERP_BACKEND'
            }
          )

          // Fetch dynamic adjustment configurations
          const ajusteConfigRepo = queryRunner.manager.getRepository(AjusteConfig)
          let consumoAjusteConfig = 'CONSUMO'
          let entradaAjusteConfig = 'ENTRADA'
          try {
            const cConfig = await ajusteConfigRepo.findOneBy({ ajusteBase: 'C' })
            if (cConfig && cConfig.ajusteConfig) {
              consumoAjusteConfig = cConfig.ajusteConfig
            }
            const oConfig = await ajusteConfigRepo.findOneBy({ ajusteBase: 'O' })
            if (oConfig && oConfig.ajusteConfig) {
              entradaAjusteConfig = oConfig.ajusteConfig
            }
          } catch (err) {
            console.error('Error fetching dynamic ajusteConfig values from database', err)
          }

          // Create Lineas Consumo (Softland) - Line 1 to M
          let lineIndex = 1
          for (const mp of listMP) {
            const softlandLineC = queryRunner.manager.create(LineaDocInv, {
              paqueteInventario: packageCode,
              documentoInv: existing.documentoConsumo,
              lineaDocInv: lineIndex++,
              nit: null,
              articulo: mp.articulo,
              bodega: mergedBodega,
              localizacion: null,
              lote: null,
              tipo: 'C',
              subtipo: 'D',
              subsubtipo: 'N',
              ajusteConfig: consumoAjusteConfig,
              cantidad: Number(mp.cantidad),
              costoTotalLocal: 0,
              costoTotalDolar: 0,
              precioTotalLocal: 0,
              precioTotalDolar: 0,
              bodegaDestino: '',
              centroCosto: null,
              cuentaContable: null,
              costoTotalLocalComp: 0,
              costoTotalDolarComp: 0
            })
            await queryRunner.manager.save(softlandLineC)
          }

          // Fetch latest exchange rate
          let exchangeRate = 8.5
          try {
            const latestRateRow = await queryRunner.manager.getRepository(TipoCambioHist).findOne({
              where: { tipo: 'OFIC' },
              order: { fecha: 'DESC' },
            })
            if (latestRateRow && latestRateRow.monto) {
              exchangeRate = Number(latestRateRow.monto)
            }
          } catch (err) {
            console.error('Error fetching latest exchange rate from TIPO_CAMBIO_HIST', err)
          }

          // Create Lineas Entrada (Softland) - Lines M+1 to M+N
          for (let i = 0; i < detalles.length; i++) {
            const d = detalles[i]
            const calcProd = calc.productos[i]

            const art = articulosMap.get(d.articulo)
            const isLbs = d.esMermaRecorte ||
                          (art?.unidadAlmacen && (
                            art.unidadAlmacen.toUpperCase() === 'LBS' ||
                            art.unidadAlmacen.toUpperCase() === 'LB' ||
                            unidadesLbsCodes.has(art.unidadAlmacen.toUpperCase())
                          ))
            const qty = isLbs ? Number(d.cantidadLibra) : Number(d.cantidadUnitaria)
            if (qty <= 0) continue

            const unitCost = isLbs ? calcProd.nuevoCostoLibra : calcProd.nuevoCostoUnitario

            const softlandLineN = queryRunner.manager.create(LineaDocInv, {
              paqueteInventario: packageCode,
              documentoInv: existing.documentoConsumo,
              lineaDocInv: lineIndex++,
              nit: null,
              articulo: d.articulo,
              bodega: d.bodega || mergedBodega,
              localizacion: null,
              lote: null,
              tipo: 'O',
              subtipo: 'D',
              subsubtipo: 'L',
              ajusteConfig: entradaAjusteConfig,
              cantidad: qty,
              costoTotalLocal: Number(unitCost),
              costoTotalDolar: Number((unitCost / exchangeRate).toFixed(8)),
              precioTotalLocal: 0,
              precioTotalDolar: 0,
              bodegaDestino: '',
              centroCosto: null,
              cuentaContable: null,
              costoTotalLocalComp: Number(unitCost),
              costoTotalDolarComp: Number((unitCost / exchangeRate).toFixed(8))
            })
            await queryRunner.manager.save(softlandLineN)
          }
        }
      }

      await queryRunner.commitTransaction()
      return this.findOne(id)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async remove(id: number) {
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
      const detailsRepository = queryRunner.manager.getRepository(OrdenProduccionDetalle)
      await detailsRepository.delete({ vinculoId: id })
      await queryRunner.manager.delete(OrdenProduccionVinculo, id)
      await queryRunner.commitTransaction()
      return { success: true }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  calcular(dto: any) {
    const { materiaPrima, materiasPrimas, productos, factors } = dto

    let listMP = materiasPrimas
    if (!listMP && materiaPrima) {
      listMP = [materiaPrima]
    }
    if (!listMP || listMP.length === 0) {
      throw new BadRequestException('Materia prima es requerida')
    }

    const totalCostoMP = listMP.reduce((sum, mp) => sum + Number(mp.cantidad || 0) * Number(mp.costoUnitario || 0), 0)
    const totalLibrasMP = listMP.reduce((sum, mp) => sum + Number(mp.cantidad || 0), 0)
    const promedioUnitarioMP = totalLibrasMP > 0 ? totalCostoMP / totalLibrasMP : 0

    let totalCostoSubproducts = 0
    let totalLibrasMainProducts = 0

    const updatedProductos = productos.map(p => {
      if (p.esMermaRecorte) {
        const factorObj = factors.find(f => f.articulo === p.articulo)
        const factor = factorObj ? Number(factorObj.factor) : 0.20
        const nuevoCostoLibra = promedioUnitarioMP * factor
        const costoTotal = Number(p.cantidadLibra) * nuevoCostoLibra
        totalCostoSubproducts += costoTotal
        return {
          ...p,
          nuevoCostoLibra,
          nuevoCostoUnitario: nuevoCostoLibra,
          costoTotal,
        }
      } else {
        totalLibrasMainProducts += Number(p.cantidadLibra)
        return p
      }
    })

    const remainingCosto = totalCostoMP - totalCostoSubproducts
    const nuevoCostoLibraMain = totalLibrasMainProducts > 0 ? remainingCosto / totalLibrasMainProducts : 0

    const finalProductos = updatedProductos.map(p => {
      if (!p.esMermaRecorte) {
        const costoTotal = Number(p.cantidadLibra) * nuevoCostoLibraMain
        const nuevoCostoUnitario = Number(p.cantidadUnitaria) > 0 ? costoTotal / Number(p.cantidadUnitaria) : null
        return {
          ...p,
          nuevoCostoLibra: nuevoCostoLibraMain,
          nuevoCostoUnitario,
          costoTotal,
          asignacionCosto: totalCostoMP > 0 ? (costoTotal / totalCostoMP) * 100 : 0
        }
      } else {
        return {
          ...p,
          asignacionCosto: totalCostoMP > 0 ? (p.costoTotal / totalCostoMP) * 100 : 0
        }
      }
    })

    const totalLibrasProducidas = productos.reduce((sum, p) => sum + Number(p.cantidadLibra), 0)
    const sumCostoOutputs = finalProductos.reduce((sum, p) => sum + p.costoTotal, 0)
    const mermaLibras = totalLibrasMP - totalLibrasMainProducts
    const mermaPorcentaje = totalLibrasMP > 0 ? (mermaLibras / totalLibrasMP) * 100 : 0
    const balance = totalCostoMP - sumCostoOutputs

    return {
      totalCostoMP,
      totalLibrasMP,
      promedioUnitarioMP,
      totalLibrasProducidas,
      totalLibrasMainProducts,
      totalCostoSubproducts,
      nuevoCostoLibraMain,
      productos: finalProductos,
      sumCostoOutputs,
      mermaLibras,
      mermaPorcentaje,
      balance
    }
  }

  private async buscarReferenciaHistorica(documentoConsumo: string): Promise<string | null> {
    if (!documentoConsumo) return null

    const sanitized = documentoConsumo.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!sanitized) return null

    const dbSchema = process.env.DATABASE_SCHEMA ?? process.env.DATABASE_NAME ?? 'ESKIMO'

    try {
      const res = await this.dataSource.query(
        `SELECT TOP 1 REFERENCIA as referencia FROM [${dbSchema}].[AUDIT_TRANS_INV] WHERE APLICACION = '${sanitized}'`
      )
      if (res && res.length > 0 && res[0].referencia) {
        return res[0].referencia.trim()
      }
    } catch (err) {
      console.error(`Error querying [${dbSchema}].[AUDIT_TRANS_INV] for reference:`, err.message)
    }

    try {
      const res = await this.dataSource.query(
        `SELECT TOP 1 REFERENCIA as referencia FROM [${dbSchema}].[TRANSACCION_INV] WHERE DOCUMENTO = '${sanitized}'`
      )
      if (res && res.length > 0 && res[0].referencia) {
        return res[0].referencia.trim()
      }
    } catch (err) {
      console.error(`Error querying [${dbSchema}].[TRANSACCION_INV] for reference:`, err.message)
    }

    return null
  }
}

