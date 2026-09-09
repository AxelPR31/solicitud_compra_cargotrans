import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { LineaDocInv } from './entities/linea-doc-inv.entity'
import { CreateLineaDocInvDto } from './dto/create-linea-doc-inv.dto'
import { UpdateLineaDocInvDto } from './dto/update-linea-doc-inv.dto'
import { PaginationDto } from '../common/dto/pagination.dto'
import { AjusteConfig } from '../ajuste-config/entities/ajuste-config.entity'
import { TipoCambioHist } from '../tipo-cambio-hist/entities/tipo-cambio-hist.entity'

@Injectable()
export class LineaDocInvService {
  private repository: Repository<LineaDocInv>
  private ajusteConfigRepository: Repository<AjusteConfig>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(LineaDocInv)
    this.ajusteConfigRepository = dataSource.getRepository(AjusteConfig)
  }

  async create(createLineaDocInvDto: CreateLineaDocInvDto) {
    // Establecer NIT a null de una para evitar conflictos de llave foránea (LINDONIT)
    createLineaDocInvDto.nit = null
    if (!createLineaDocInvDto.bodega) {
      createLineaDocInvDto.bodega = '1'
    }
    // Establecer localización a null de una para evitar conflictos de llave foránea (LIDOCLOC)
    createLineaDocInvDto.localizacion = null

    // Establecer lote a null para evitar conflictos de llave foránea (LNDOCLOT)
    createLineaDocInvDto.lote = null
    if (!createLineaDocInvDto.centroCosto) {
      createLineaDocInvDto.centroCosto = null
    }
    if (!createLineaDocInvDto.cuentaContable) {
      createLineaDocInvDto.cuentaContable = null
    }

    // Mapear tipo 'E' a 'O' para entradas en Softland
    if (createLineaDocInvDto.tipo === 'E') {
      createLineaDocInvDto.tipo = 'O'
    }

    // Mapear subtipo y subsubtipo según el tipo de movimiento (Consumo = D/N, Entrada = D/L)
    if (createLineaDocInvDto.tipo === 'C') {
      createLineaDocInvDto.subtipo = 'D'
      createLineaDocInvDto.subsubtipo = 'N'
    } else if (createLineaDocInvDto.tipo === 'O') {
      createLineaDocInvDto.subtipo = 'D'
      createLineaDocInvDto.subsubtipo = 'L'
    }

    // Poner costos en 0 para consumos (Softland calcula costo al procesar)
    if (createLineaDocInvDto.tipo === 'C') {
      createLineaDocInvDto.costoTotalLocal = 0
      createLineaDocInvDto.costoTotalDolar = 0
      createLineaDocInvDto.costoTotalLocalComp = 0
      createLineaDocInvDto.costoTotalDolarComp = 0
    } else {
      // Obtener la tasa de cambio más reciente
      let exchangeRate = 8.5; // Fallback
      try {
        const latestRateRow = await this.dataSource.getRepository(TipoCambioHist).findOne({
          where: { tipo: 'OFIC' },
          order: { fecha: 'DESC' },
        });
        if (latestRateRow && latestRateRow.monto) {
          exchangeRate = Number(latestRateRow.monto);
        }
      } catch (err) {
        console.error('Error fetching latest exchange rate from TIPO_CAMBIO_HIST', err);
      }

      // Calcular costos en dólares con la tasa de cambio real
      if (createLineaDocInvDto.costoTotalLocal) {
        createLineaDocInvDto.costoTotalDolar = Number((createLineaDocInvDto.costoTotalLocal / exchangeRate).toFixed(8));
      }
      if (createLineaDocInvDto.costoTotalLocalComp) {
        createLineaDocInvDto.costoTotalDolarComp = Number((createLineaDocInvDto.costoTotalLocalComp / exchangeRate).toFixed(8));
      }
    }

    // Campos nulos para entradas
    if (createLineaDocInvDto.tipo === 'O') {
      createLineaDocInvDto.centroCosto = null
      createLineaDocInvDto.cuentaContable = null
    }

    const isConsumo =
      createLineaDocInvDto.tipo === 'C' ||
      createLineaDocInvDto.ajusteConfig === 'CONSUMO' ||
      createLineaDocInvDto.ajusteConfig?.toUpperCase() === 'C'

    const isEntrada =
      createLineaDocInvDto.tipo === 'E' ||
      createLineaDocInvDto.ajusteConfig === 'ENTRADA' ||
      createLineaDocInvDto.ajusteConfig?.toUpperCase() === 'O'

    let ajusteBaseKey: string | null = null
    if (isConsumo) {
      ajusteBaseKey = 'C'
    } else if (isEntrada) {
      ajusteBaseKey = 'O'
    }

    if (ajusteBaseKey) {
      try {
        const config = await this.ajusteConfigRepository.findOneBy({ ajusteBase: ajusteBaseKey })
        if (config && config.ajusteConfig) {
          createLineaDocInvDto.ajusteConfig = config.ajusteConfig
        }
      } catch (err) {
        console.error('Error fetching dynamic ajusteConfig from AJUSTE_CONFIG table', err)
      }
    }

    return this.repository
      .createQueryBuilder()
      .insert()
      .into(LineaDocInv)
      .values(createLineaDocInvDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(
    paqueteInventario: string,
    documentoInv: string,
    lineaDocInv: number,
  ) {
    return this.repository.findOneBy({
      paqueteInventario,
      documentoInv,
      lineaDocInv,
    })
  }

  update(
    paqueteInventario: string,
    documentoInv: string,
    lineaDocInv: number,
    updateLineaDocInvDto: UpdateLineaDocInvDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(LineaDocInv)
      .set(updateLineaDocInvDto)
      .where(
        'PAQUETE_INVENTARIO = :paqueteInventario AND DOCUMENTO_INV = :documentoInv AND LINEA_DOC_INV = :lineaDocInv',
        { paqueteInventario, documentoInv, lineaDocInv },
      )
      .execute()
  }

  remove(
    paqueteInventario: string,
    documentoInv: string,
    lineaDocInv: number,
  ) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(LineaDocInv)
      .where(
        'PAQUETE_INVENTARIO = :paqueteInventario AND DOCUMENTO_INV = :documentoInv AND LINEA_DOC_INV = :lineaDocInv',
        { paqueteInventario, documentoInv, lineaDocInv },
      )
      .execute()
  }

  removeAll(
    paqueteInventario: string,
    documentoInv: string,
  ) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(LineaDocInv)
      .where(
        'PAQUETE_INVENTARIO = :paqueteInventario AND DOCUMENTO_INV = :documentoInv',
        { paqueteInventario, documentoInv },
      )
      .execute()
  }
}
