import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { GlobalesCo } from './entities/globales-co.entity'
import { generateSolicitudConsecutivo } from '../utils/softland-format'

@Injectable()
export class GlobalesCoService {
  private repository: Repository<GlobalesCo>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(GlobalesCo)
  }

  async findOne(): Promise<GlobalesCo> {
    const record = await this.repository.find({ take: 1 })
    if (!record.length) {
      throw new NotFoundException('No se encontró configuración en GLOBALES_CO')
    }
    return record[0]
  }

  async getSiguienteSolicitudPreview(): Promise<{ siguiente: string; actual: string }> {
    const globales = await this.findOne()
    const siguiente = generateSolicitudConsecutivo(globales.ultSolicitud)
    return { siguiente, actual: globales.ultSolicitud }
  }

  async obtenerSiguienteSolicitudConLock(manager: DataSource['manager']): Promise<string> {
    const schema = process.env.DATABASE_SCHEMA?.trim() || process.env.DATABASE_NAME?.trim() || 'CEPENAD'
    const result = await manager.query(
      `SELECT ULT_SOLICITUD, RowPointer FROM ${schema}.GLOBALES_CO WITH (UPDLOCK, ROWLOCK)`,
    )
    if (!result?.length) {
      throw new NotFoundException('No se encontró configuración en GLOBALES_CO')
    }
    const ultSolicitud = result[0].ULT_SOLICITUD as string
    const rowPointer = result[0].RowPointer as string
    const nuevoCodigo = generateSolicitudConsecutivo(ultSolicitud)
    await manager.query(
      `UPDATE ${schema}.GLOBALES_CO SET ULT_SOLICITUD = @0, RecordDate = GETDATE() WHERE RowPointer = @1`,
      [nuevoCodigo, rowPointer],
    )
    return nuevoCodigo
  }
}
