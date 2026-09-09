import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { TrasladoInternoEncabezado } from './entities/traslado-interno-encabezado.entity'
import { TrasladoInternoDetalle } from './entities/traslado-interno-detalle.entity'
import { CreateTrasladoInternoDto } from './dto/create-traslado-interno.dto'
import { UpdateTrasladoInternoDto } from './dto/update-traslado-interno.dto'
import { ConsecutivoCiService } from '../consecutivo-ci/consecutivo-ci.service'
import { DocumentoInv } from '../documento-inv/entities/documento-inv.entity'
import { LineaDocInv } from '../linea-doc-inv/entities/linea-doc-inv.entity'
import { Articulo } from '../articulo/entities/articulo.entity'
import { PaginationDto } from '../common/dto/pagination.dto'
import { TipoCambioHist } from '../tipo-cambio-hist/entities/tipo-cambio-hist.entity'
import { AjusteConfig } from '../ajuste-config/entities/ajuste-config.entity'
import { ConsecutivoAppConsumoService } from '../consecutivo-app-consumo/consecutivo-app-consumo.service'

@Injectable()
export class TrasladoInternoService {
  private repository: Repository<TrasladoInternoEncabezado>

  constructor(
    @Inject(TENANT_CONENCTION) private dataSource: DataSource,
    private consecutivoCiService: ConsecutivoCiService,
    private readonly consecutivoAppConsumoService: ConsecutivoAppConsumoService,
  ) {
    this.repository = dataSource.getRepository(TrasladoInternoEncabezado)
  }

  async create(createDto: CreateTrasladoInternoDto) {
    const { detalles, ...headerData } = createDto

    if (headerData.bodegaOrigen === headerData.bodegaDestino) {
      throw new BadRequestException('La bodega de origen y destino no pueden ser la misma.')
    }

    const activeDetails = detalles.filter(d => (Number(d.unidad || 0) > 0 || Number(d.lb || 0) > 0))
    if (activeDetails.length === 0) {
      throw new BadRequestException('El traslado debe contener al menos un artículo con cantidad mayor a cero.')
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Obtener artículos para verificar costos y existencia
      const articulosRepo = queryRunner.manager.getRepository(Articulo)
      const articleCodes = activeDetails.map(d => d.articulo)
      const dbArticulos = await articulosRepo.createQueryBuilder('a')
        .where('a.articulo IN (:...articleCodes)', { articleCodes })
        .getMany()
      const articulosMap = new Map<string, Articulo>()
      dbArticulos.forEach(art => articulosMap.set(art.articulo, art))

      // 2. Validar que ningún artículo tenga costo 0
      for (const d of activeDetails) {
        const art = articulosMap.get(d.articulo)
        const liveCost = Number(art?.costoPromLoc || 0)
        if (liveCost <= 0) {
          throw new BadRequestException(
            `No se puede trasladar el artículo ${d.articulo} (${art?.descripcion || d.descripcion}) porque tiene costo 0 (no registra entradas anteriores en Softland).`
          )
        }
      }

      if (!headerData.numeroDocumento || headerData.numeroDocumento === 'AUTO') {
        const nextDocNum = await this.consecutivoAppConsumoService.obtenerSiguiente('TRASLADO_INTERNO', queryRunner.manager)
        headerData.numeroDocumento = nextDocNum
      }

      // Guardar cabecera
      const header = queryRunner.manager.create(TrasladoInternoEncabezado, {
        ...headerData,
        documentoInvSoftland: null,
        fecha: (() => {
          if (!headerData.fecha) return new Date();
          const parts = String(headerData.fecha).split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day, 12, 0, 0);
          }
          return new Date(headerData.fecha);
        })(),
        estado: 'Pendiente',
      })
      const savedHeader = await queryRunner.manager.save(header)

      // Guardar detalles con costoUnitario asignado si el frontend envió 0
      const detailEntities = activeDetails.map(d => {
        const art = articulosMap.get(d.articulo)
        const liveCost = Number(art?.costoPromLoc || 0)
        const storageUnit = (art?.unidadAlmacen || '').toUpperCase()
        const isLbs = storageUnit === 'LBS' || storageUnit === 'LB' || storageUnit.includes('LIBRA')
        const qty = isLbs ? Number(d.lb || 0) : Number(d.unidad || 0)
        const finalCost = Number(d.costoUnitario || liveCost)
        return queryRunner.manager.create(TrasladoInternoDetalle, {
          ...d,
          costoUnitario: finalCost,
          costoTotal: Number((qty * finalCost).toFixed(4)),
          trasladoInternoId: savedHeader.id,
        })
      })
      await queryRunner.manager.save(detailEntities)

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
    const { limit = 100, offset = 0 } = paginationDto
    const headers = await this.repository.find({
      take: limit,
      skip: offset,
      order: { id: 'DESC' },
    })

    if (headers.length === 0) return []

    const headerIds = headers.map(h => h.id)
    const detailsRepo = this.dataSource.getRepository(TrasladoInternoDetalle)
    const allDetails = await detailsRepo.createQueryBuilder('d')
      .where('d.trasladoInternoId IN (:...headerIds)', { headerIds })
      .getMany()

    return headers.map(h => ({
      ...h,
      bodegaOrigen: h.bodegaOrigen?.trim(),
      bodegaDestino: h.bodegaDestino?.trim(),
      detalles: allDetails.filter(d => d.trasladoInternoId === h.id)
    }))
  }

  async findOne(id: number) {
    const header = await this.repository.findOneBy({ id })
    if (!header) {
      throw new NotFoundException(`Traslado interno con ID ${id} no encontrado`)
    }
    const detailsRepo = this.dataSource.getRepository(TrasladoInternoDetalle)
    const detalles = await detailsRepo.find({
      where: { trasladoInternoId: id },
    })
    return {
      ...header,
      bodegaOrigen: header.bodegaOrigen?.trim(),
      bodegaDestino: header.bodegaDestino?.trim(),
      detalles,
    }
  }

  async update(id: number, updateDto: UpdateTrasladoInternoDto) {
    const existing = await this.findOne(id)
    if (!existing) {
      throw new NotFoundException(`Traslado interno con ID ${id} no encontrado`)
    }

    if (existing.estado !== 'Pending' && existing.estado !== 'Pendiente') {
      throw new BadRequestException('Solo se pueden editar traslados con estado Pendiente.')
    }

    const { detalles, ...headerData } = updateDto

    // Merge new header data with existing to validate bodega
    const mergedBodegaOrigen = headerData.bodegaOrigen !== undefined ? headerData.bodegaOrigen : existing.bodegaOrigen
    const mergedBodegaDestino = headerData.bodegaDestino !== undefined ? headerData.bodegaDestino : existing.bodegaDestino

    if (mergedBodegaOrigen === mergedBodegaDestino) {
      throw new BadRequestException('La bodega de origen y destino no pueden ser la misma.')
    }

    // If details are provided, validate them
    let activeDetails = detalles
    if (detalles) {
      activeDetails = detalles.filter(d => (Number(d.unidad || 0) > 0 || Number(d.lb || 0) > 0))
      if (activeDetails.length === 0) {
        throw new BadRequestException('El traslado debe contener al menos un artículo con cantidad mayor a cero.')
      }

      // Validate costs of active items
      const articulosRepo = this.dataSource.getRepository(Articulo)
      const articleCodes = activeDetails.map(d => d.articulo)
      const dbArticulos = await articulosRepo.createQueryBuilder('a')
        .where('a.articulo IN (:...articleCodes)', { articleCodes })
        .getMany()
      const articulosMap = new Map<string, Articulo>()
      dbArticulos.forEach(art => articulosMap.set(art.articulo, art))

      for (const d of activeDetails) {
        const art = articulosMap.get(d.articulo)
        const liveCost = Number(art?.costoPromLoc || 0)
        if (liveCost <= 0) {
          throw new BadRequestException(
            `No se puede trasladar el artículo ${d.articulo} (${art?.descripcion || d.descripcion}) porque tiene costo 0 (no registra entradas anteriores en Softland).`
          )
        }
      }
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Update header fields
      const updatePayload: any = { ...headerData };
      if (headerData.fecha) {
        updatePayload.fecha = (() => {
          const parts = String(headerData.fecha).split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            return new Date(year, month, day, 12, 0, 0);
          }
          return new Date(headerData.fecha);
        })();
      }

      await queryRunner.manager.update(TrasladoInternoEncabezado, id, updatePayload)

      // 2. If details were updated, replace them
      if (detalles) {
        // Delete old details
        await queryRunner.manager.delete(TrasladoInternoDetalle, { trasladoInternoId: id })

        // Fetch articles again inside transaction to get latest costs
        const articulosRepo = queryRunner.manager.getRepository(Articulo)
        const articleCodes = activeDetails.map(d => d.articulo)
        const dbArticulos = await articulosRepo.createQueryBuilder('a')
          .where('a.articulo IN (:...articleCodes)', { articleCodes })
          .getMany()
        const articulosMap = new Map<string, Articulo>()
        dbArticulos.forEach(art => articulosMap.set(art.articulo, art))

        // Create new details
        const detailEntities = activeDetails.map(d => {
          const art = articulosMap.get(d.articulo)
          const liveCost = Number(art?.costoPromLoc || 0)
          const storageUnit = (art?.unidadAlmacen || '').toUpperCase()
          const isLbs = storageUnit === 'LBS' || storageUnit === 'LB' || storageUnit.includes('LIBRA')
          const qty = isLbs ? Number(d.lb || 0) : Number(d.unidad || 0)
          const finalCost = Number(d.costoUnitario || liveCost)

          const { id: dummyId, ...rest } = d as any; // Strip frontend ID if any
          return queryRunner.manager.create(TrasladoInternoDetalle, {
            ...rest,
            costoUnitario: finalCost,
            costoTotal: Number((qty * finalCost).toFixed(4)),
            trasladoInternoId: id,
          })
        })
        await queryRunner.manager.save(detailEntities)
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
      const detailsRepo = queryRunner.manager.getRepository(TrasladoInternoDetalle)
      await detailsRepo.delete({ trasladoInternoId: id })
      await queryRunner.manager.delete(TrasladoInternoEncabezado, id)
      await queryRunner.commitTransaction()
      return { success: true }
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }

  async rechazar(id: number) {
    const header = await this.repository.findOneBy({ id })
    if (!header) {
      throw new NotFoundException(`Traslado interno con ID ${id} no encontrado`)
    }
    if (header.estado !== 'Pendiente') {
      throw new BadRequestException('Solo se pueden rechazar traslados con estado Pendiente.')
    }
    header.estado = 'Rechazado'
    await this.repository.save(header)
    return this.findOne(id)
  }

  async aprobar(id: number, usuarioAprobador: string = 'ERPADMIN') {
    const traslado = await this.findOne(id)
    if (traslado.estado !== 'Pending' && traslado.estado !== 'Pendiente') {
      throw new BadRequestException('Solo se pueden aprobar traslados con estado Pendiente.')
    }

    const packageCode = process.env.TRASLADO_PAQUETE || 'TLDE'
    const consecutiveCode = process.env.TRASLADO_CONSECUTIVO || 'TESPECIAL'

    // Obtener siguiente consecutivo
    const { siguiente: docNum } = await this.consecutivoCiService.obtenerSiguiente(consecutiveCode)

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // 1. Obtener la tasa de cambio oficial más reciente
      let exchangeRate = 8.5; // Fallback
      try {
        const latestRateRow = await queryRunner.manager.getRepository(TipoCambioHist).findOne({
          where: { tipo: 'OFIC' },
          order: { fecha: 'DESC' },
        });
        if (latestRateRow && latestRateRow.monto) {
          exchangeRate = Number(latestRateRow.monto);
        }
      } catch (err) {
        console.error('Error fetching latest exchange rate from TIPO_CAMBIO_HIST', err);
      }

      // 2. Obtener los códigos dinámicos de ajusteConfig de la base de datos
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

      // 3. Crear cabecera en Softland DOCUMENTO_INV
      const softlandHeader = queryRunner.manager.create(DocumentoInv, {
        paqueteInventario: packageCode,
        documentoInv: docNum,
        consecutivo: consecutiveCode,
        referencia: traslado.referencia || `Traslado de Restaurante - ID: ${traslado.id}`,
        fechaDocumento: traslado.fecha,
        fechaHorCreacion: new Date(),
        seleccionado: 'N',
        usuario: usuarioAprobador,
      })
      await queryRunner.manager.save(softlandHeader)

      // 4. Obtener artículos para verificar unidad de almacén
      const articulosRepo = queryRunner.manager.getRepository(Articulo)
      const articleCodes = traslado.detalles.map(d => d.articulo)
      const dbArticulos = await articulosRepo.createQueryBuilder('a')
        .where('a.articulo IN (:...articleCodes)', { articleCodes })
        .getMany()
      const articulosMap = new Map<string, Articulo>()
      dbArticulos.forEach(art => articulosMap.set(art.articulo, art))

      // 5. Crear líneas en Softland LINEA_DOC_INV
      let lineIndex = 1

      // Insertar Consumo (Bodega Origen)
      for (const det of traslado.detalles) {
        const art = articulosMap.get(det.articulo)
        const storageUnit = (art?.unidadAlmacen || '').toUpperCase()
        const isLbs = storageUnit === 'LBS' || storageUnit === 'LB' || storageUnit.includes('LIBRA')
        const qty = isLbs ? Number(det.lb) : Number(det.unidad)

        if (qty <= 0) continue

        const consumoLine = queryRunner.manager.create(LineaDocInv, {
          paqueteInventario: packageCode,
          documentoInv: docNum,
          lineaDocInv: lineIndex++,
          ajusteConfig: consumoAjusteConfig,
          nit: null,
          articulo: det.articulo,
          bodega: traslado.bodegaOrigen,
          localizacion: null,
          lote: null,
          tipo: 'C',
          subtipo: 'D',
          subsubtipo: 'N',
          cantidad: qty,
          costoTotalLocal: 0,
          costoTotalDolar: 0,
          precioTotalLocal: 0,
          precioTotalDolar: 0,
          bodegaDestino: '',
          centroCosto: null,
          cuentaContable: null,
          costoTotalLocalComp: 0,
          costoTotalDolarComp: 0,
        } as any)
        await queryRunner.manager.save(consumoLine)
      }

      // Insertar Entrada (Bodega Destino)
      for (const det of traslado.detalles) {
        const art = articulosMap.get(det.articulo)
        const storageUnit = (art?.unidadAlmacen || '').toUpperCase()
        const isLbs = storageUnit === 'LBS' || storageUnit === 'LB' || storageUnit.includes('LIBRA')
        const qty = isLbs ? Number(det.lb) : Number(det.unidad)

        if (qty <= 0) continue

        const cost = Number(det.costoUnitario || 0)
        const costDolar = Number((cost / exchangeRate).toFixed(8))

        const entradaLine = queryRunner.manager.create(LineaDocInv, {
          paqueteInventario: packageCode,
          documentoInv: docNum,
          lineaDocInv: lineIndex++,
          ajusteConfig: entradaAjusteConfig,
          nit: null,
          articulo: det.articulo,
          bodega: traslado.bodegaDestino,
          localizacion: null,
          lote: null,
          tipo: 'O',
          subtipo: 'D',
          subsubtipo: 'L',
          cantidad: qty,
          costoTotalLocal: cost,
          costoTotalDolar: costDolar,
          precioTotalLocal: 0,
          precioTotalDolar: 0,
          bodegaDestino: '',
          centroCosto: null,
          cuentaContable: null,
          costoTotalLocalComp: cost,
          costoTotalDolarComp: costDolar,
        } as any)
        await queryRunner.manager.save(entradaLine)
      }

      // 6. Actualizar la cabecera local
      await queryRunner.manager.update(TrasladoInternoEncabezado, id, {
        estado: 'Aprobado',
        documentoInvSoftland: docNum,
      })

      await queryRunner.commitTransaction()
      return this.findOne(id)
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }
  }
}
