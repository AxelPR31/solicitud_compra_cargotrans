import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'
import { ExistenciaBodega } from './entities/existencia-bodega.entity'
import { CreateExistenciaBodegaDto } from './dto/create-existencia-bodega.dto'
import { UpdateExistenciaBodegaDto } from './dto/update-existencia-bodega.dto'

@Injectable()
export class ExistenciaBodegaService {
  private repository: Repository<ExistenciaBodega>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(ExistenciaBodega)
  }

  create(dto: CreateExistenciaBodegaDto) {
    return this.repository.createQueryBuilder().insert().values(dto).execute()
  }

  async findAll(paginationDto: PaginationDto & { q?: string }) {
    const { limit = 100, offset = 0 } = paginationDto
    const q = (paginationDto.q || '').toString().trim()

    const qb = this.repository.createQueryBuilder('eb')

    if (q) {
      qb.where(
        `(
          eb.ARTICULO LIKE :q OR
          eb.BODEGA LIKE :q
        )`,
        { q: `%${q}%` },
      )
    }

    return qb.take(limit).skip(offset).getMany()
  }

  findOne(params: { articulo: string; bodega: string }) {
    return this.repository.findOneBy({
      articulo: params.articulo,
      bodega: params.bodega,
    })
  }

  update(
    params: { articulo: string; bodega: string },
    dto: UpdateExistenciaBodegaDto,
  ) {
    return this.repository
      .createQueryBuilder()
      .update(ExistenciaBodega)
      .set(dto)
      .where('ARTICULO = :articulo', { articulo: params.articulo })
      .andWhere('BODEGA = :bodega', { bodega: params.bodega })
      .execute()
  }

  remove(params: { articulo: string; bodega: string }) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(ExistenciaBodega)
      .where('ARTICULO = :articulo', { articulo: params.articulo })
      .andWhere('BODEGA = :bodega', { bodega: params.bodega })
      .execute()
  }
}
