import { BadRequestException, Inject, Injectable } from '@nestjs/common'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { ConsecutivoAppConsumo, TipoConsecutivo } from './entities/consecutivo-app-consumo.entity'

@Injectable()
export class ConsecutivoAppConsumoService {
  private repository: Repository<ConsecutivoAppConsumo>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ConsecutivoAppConsumo)
  }

  async obtenerSiguiente(tipo: TipoConsecutivo, manager?: EntityManager): Promise<string> {
    const repo = manager ? manager.getRepository(ConsecutivoAppConsumo) : this.repository
    const record = await repo.findOneBy({ tipo })
    if (!record) {
      throw new BadRequestException(`No se ha configurado un consecutivo para el tipo de documento "${tipo}". Por favor créelo en la pestaña de Consecutivos.`)
    }

    const nextVal = record.siguiente
    const mascara = record.mascara || '######'
    const numHash = (mascara.match(/#/g) || []).length
    const paddedNum = String(nextVal).padStart(numHash, '0')

    let formattedVal = mascara
    if (numHash > 0) {
      const hashes = '#'.repeat(numHash)
      formattedVal = mascara.replace(hashes, paddedNum)
    } else {
      formattedVal = `${mascara}${nextVal}`
    }

    record.siguiente = nextVal + 1
    await repo.save(record)

    return formattedVal
  }

  async previewSiguiente(tipo: TipoConsecutivo): Promise<string> {
    const record = await this.repository.findOneBy({ tipo })
    if (!record) {
      return 'No configurado'
    }
    const nextVal = record.siguiente
    const mascara = record.mascara || '######'
    const numHash = (mascara.match(/#/g) || []).length
    const paddedNum = String(nextVal).padStart(numHash, '0')

    let formattedVal = mascara
    if (numHash > 0) {
      const hashes = '#'.repeat(numHash)
      formattedVal = mascara.replace(hashes, paddedNum)
    } else {
      formattedVal = `${mascara}${nextVal}`
    }

    return formattedVal
  }

  async findAll(): Promise<ConsecutivoAppConsumo[]> {
    return this.repository.find({ order: { tipo: 'ASC' } })
  }

  async create(dto: Partial<ConsecutivoAppConsumo>): Promise<ConsecutivoAppConsumo> {
    const existing = await this.repository.findOneBy({ tipo: dto.tipo })
    if (existing) {
      throw new BadRequestException(`Ya existe un consecutivo configurado para el tipo "${dto.tipo}".`)
    }
    const record = this.repository.create(dto)
    return this.repository.save(record)
  }

  async update(tipo: TipoConsecutivo, dto: Partial<ConsecutivoAppConsumo>): Promise<ConsecutivoAppConsumo> {
    await this.repository.update(tipo, dto)
    return this.repository.findOneBy({ tipo })
  }

  async remove(tipo: TipoConsecutivo): Promise<any> {
    return this.repository.delete({ tipo })
  }
}
