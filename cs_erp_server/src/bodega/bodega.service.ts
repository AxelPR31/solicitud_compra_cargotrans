import { Inject, Injectable } from '@nestjs/common'
import { DataSource, Repository, Like } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { Bodega } from './entities/bodega.entity'
import { CreateBodegaDto } from './dto/create-bodega.dto'
import { UpdateBodegaDto } from './dto/update-bodega.dto'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class BodegaService {
  private repository: Repository<Bodega>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Bodega)
  }

  create(createBodegaDto: CreateBodegaDto) {
    return this.repository
      .createQueryBuilder()
      .insert()
      .into(Bodega)
      .values(createBodegaDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto, q?: string) {
    const { limit = 50, offset = 0 } = paginationDto

    if (q) {
      return this.repository.find({
        where: [
          { bodega: Like(`%${q}%`) },
          { nombre: Like(`%${q}%`) },
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

  findOne(bodega: string) {
    return this.repository.findOneBy({ bodega })
  }

  update(bodega: string, updateBodegaDto: UpdateBodegaDto) {
    return this.repository
      .createQueryBuilder()
      .update(Bodega)
      .set(updateBodegaDto)
      .where('BODEGA = :bodega', { bodega })
      .execute()
  }

  remove(bodega: string) {
    return this.repository
      .createQueryBuilder()
      .delete()
      .from(Bodega)
      .where('BODEGA = :bodega', { bodega })
      .execute()
  }
}
