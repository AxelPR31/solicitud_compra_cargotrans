import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { Diario } from './entities/diario.entity'
import { CreateDiarioDto } from './dto/create-diario.dto'
import { UpdateDiarioDto } from './dto/update-diario.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class DiarioService {
  private repository: Repository<Diario>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Diario)
  }

  create(createDiarioDto: CreateDiarioDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(Diario)
      .values(createDiarioDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto

    const diario = await this.repository.find({
      take: limit,
      skip: offset,
    })

    return diario
  }

  findOne(asiento: string, consecutivo: number) {
    return this.repository
      .createQueryBuilder('diario')
      .where(
        'diario.asiento = :asiento AND diario.consecutivo = :consecutivo',
        {
          asiento,
          consecutivo,
        },
      )
      .getOne()
  }

  update(
    asiento: string,
    consecutivo: number,
    updateDiarioDto: UpdateDiarioDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(Diario)
      .set(updateDiarioDto)
      .where('asiento = :asiento AND consecutivo = :consecutivo', {
        asiento,
        consecutivo,
      })
      .execute()
  }

  remove(asiento: string, consecutivo: number) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(Diario)
      .where('asiento = :asiento AND consecutivo = :consecutivo', {
        asiento,
        consecutivo,
      })
      .execute()
  }
}
