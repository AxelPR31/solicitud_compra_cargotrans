import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { ConsecutivoCi } from './entities/consecutivo-ci.entity'
import { CreateConsecutivoCiDto } from './dto/create-consecutivo-ci.dto'
import { UpdateConsecutivoCiDto } from './dto/update-consecutivo-ci.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class ConsecutivoCiService {
  private repository: Repository<ConsecutivoCi>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ConsecutivoCi)
  }

  create(createConsecutivoCiDto: CreateConsecutivoCiDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(ConsecutivoCi)
      .values(createConsecutivoCiDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(consecutivo: string) {
    return this.repository.findOneBy({ consecutivo })
  }

  update(consecutivo: string, updateConsecutivoCiDto: UpdateConsecutivoCiDto) {
    return this.repository
      .createQueryBuilder()
      .update(ConsecutivoCi)
      .set(updateConsecutivoCiDto)
      .where('CONSECUTIVO = :consecutivo', { consecutivo })
      .execute()
  }

  remove(consecutivo: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(ConsecutivoCi)
      .where('CONSECUTIVO = :consecutivo', { consecutivo })
      .execute()
  }

  async obtenerSiguiente(consecutivo: string) {
    const record = await this.findOne(consecutivo)
    if (!record) {
      throw new Error(`El consecutivo "${consecutivo}" no existe en CONSECUTIVO_CI`)
    }

    const currentVal = record.siguienteConsec
    const match = currentVal.match(/^([^0-9]*)(\d+)$/)
    if (!match) {
      throw new Error(`El valor consecutivo actual "${currentVal}" no tiene un formato numérico válido`)
    }

    const prefix = match[1]
    const numericStr = match[2]
    const nextNum = parseInt(numericStr, 10) + 1
    const paddedNum = nextNum.toString().padStart(numericStr.length, '0')
    const newVal = `${prefix}${paddedNum}`

    // Update DB
    await this.update(consecutivo, { siguienteConsec: newVal })
    return { siguiente: newVal }
  }
}
