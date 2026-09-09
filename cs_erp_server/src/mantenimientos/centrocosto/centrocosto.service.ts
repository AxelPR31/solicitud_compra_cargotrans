import { Inject, Injectable } from '@nestjs/common'
import { CreateCentrocostoDto } from './dto/create-centrocosto.dto'
import { UpdateCentrocostoDto } from './dto/update-centrocosto.dto'
import { DataSource, Repository } from 'typeorm'
import { Centrocosto } from './entities/centrocosto.entity'
import { TENANT_CONENCTION } from '../../tenant/tenant.module'
import { PageOptionsDto } from '../../core/paging/dtos/page-options.dto'
import { PageDto } from '../../core/paging/dtos/page.dto'
import { PageMetaDto } from '../../core/paging/dtos/page-meta.dto'
import { PaginationDto } from '../../common/dto/pagination.dto'

@Injectable()
export class CentrocostoService {
  private repository: Repository<Centrocosto>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Centrocosto)
  }

  async create(createCentrocostoDto: CreateCentrocostoDto) {
    const existsProduct = await this.repository
      .createQueryBuilder()
      .where('centro_costo = :id', { id: createCentrocostoDto.centrocosto })
      .getOne()

    if (existsProduct) throw new Error('El centro de costo ya existe')

    return await this.repository
      .createQueryBuilder()
      .insert()
      .values(createCentrocostoDto)
      .execute()
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }
  async search(searchValue: string) {
    return this.repository
      .createQueryBuilder()
      .where(
        'CENTRO_COSTO like :searchValue or ACEPTA_DATOS like :searchValue or descripcion like :searchValue ',
        {
          searchValue: `%${searchValue}%`,
        },
      )
      .getMany()
  }
  public async getCentrocosto(
    pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<Centrocosto>> {
    const qb = this.repository.createQueryBuilder('centrocosto')
    qb.orderBy(
      `centrocosto.${pageOptionsDto.property ?? 'centrocosto'}`,
      pageOptionsDto.order,
    )
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)

    return Promise.all([qb.getCount(), qb.getRawAndEntities()])
      .then(([count, data]) => {
        const pageMetaDto = new PageMetaDto({
          itemCount: count,
          pageOptionsDto,
        })
        return new PageDto<Centrocosto>(data.entities, pageMetaDto)
      })
      .catch((e) => {
        console.error('Error Fetching subtimo hehehehe ' + e.message)
        throw e
      })
  }

 findOne(centroCosto: string) {
  return this.repository
    .createQueryBuilder('cc')
    .where('cc.centrocosto = :centroCosto', { centroCosto })
    .getOne()
}

  update(centroCosto: string, updateCentrocostoDto: UpdateCentrocostoDto) {
    return this.repository
      .createQueryBuilder()
      .update()
      .set(updateCentrocostoDto)
      .where('centrocosto = :centroCosto', { centroCosto })
      .execute()
  }

  async remove(centroCosto: string) {
    return await this.repository
      .createQueryBuilder()
      .delete()
      .where('centrocosto = :centrocosto', { centrocosto: centroCosto })
      .execute()
  }
}
