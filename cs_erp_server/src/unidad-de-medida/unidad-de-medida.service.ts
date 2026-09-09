import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository, Like } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { UnidadDeMedida } from './entities/unidad-de-medida.entity'
import { CreateUnidadDeMedidaDto } from './dto/create-unidad-de-medida.dto'
import { UpdateUnidadDeMedidaDto } from './dto/update-unidad-de-medida.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class UnidadDeMedidaService {
  private repository: Repository<UnidadDeMedida>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(UnidadDeMedida)
  }

  create(createUnidadDeMedidaDto: CreateUnidadDeMedidaDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(UnidadDeMedida)
      .values(createUnidadDeMedidaDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto & { q?: string }) {
    const { limit = 100, offset = 0, q } = paginationDto

    if (q) {
      return this.repository.find({
        where: [
          { unidadMedida: Like(`%${q}%`) },
          { descripcion: Like(`%${q}%`) },
        ],
        take: limit,
        skip: offset,
      })
    }

    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  findOne(unidadMedida: string) {
    return this.repository.findOneBy({ unidadMedida })
  }

  update(unidadMedida: string, updateUnidadDeMedidaDto: UpdateUnidadDeMedidaDto) {
    return this.repository
      .createQueryBuilder()
      .update(UnidadDeMedida)
      .set(updateUnidadDeMedidaDto)
      .where('UNIDAD_MEDIDA = :unidadMedida', { unidadMedida })
      .execute()
  }

  remove(unidadMedida: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(UnidadDeMedida)
      .where('UNIDAD_MEDIDA = :unidadMedida', { unidadMedida })
      .execute()
  }
}
