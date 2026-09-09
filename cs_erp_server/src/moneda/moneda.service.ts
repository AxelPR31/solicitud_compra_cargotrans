import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from 'src/core/guards/auth.guard'
import { PageMetaDto } from 'src/core/paging/dtos/page-meta.dto'
import { PageOptionsDto } from 'src/core/paging/dtos/page-options.dto'
import { PageDto } from 'src/core/paging/dtos/page.dto'
import { DataSource, Repository } from 'typeorm'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { CreateMonedaDto } from './dto/create-moneda.dto'
import { UpdateMonedaDto } from './dto/update-moneda.dto'
import { Moneda } from './entities/moneda.entity'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class MonedaService {
  private repository: Repository<Moneda>

  constructor(@Inject(TENANT_CONENCTION) dataSource: DataSource) {
    this.repository = dataSource.getRepository(Moneda)
  }

  async create(createMonedaDto: CreateMonedaDto) {
    const moneda = await this.repository.findOneBy({
      moneda: createMonedaDto.moneda,
    })
    if (moneda) {
      throw new HttpException(
        { message: `Existe moneda con id ${createMonedaDto.moneda}` },
        HttpStatus.NOT_FOUND,
      )
    }
    await this.repository.save(createMonedaDto)
    return createMonedaDto
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto
    return this.repository.find({
      take: limit,
      skip: offset,
    })
  }

  async findOne(id: string) {
    const moneda = await this.repository.findOneBy({
      moneda: id,
    })
    if (!moneda) {
      throw new HttpException(
        { message: `No existe moneda con id ${id}` },
        HttpStatus.NOT_FOUND,
      )
    }
    return moneda
  }

  async update(id: string, updateMonedaDto: UpdateMonedaDto) {
    const moneda = await this.repository.findOneBy({
      moneda: id,
    })
    if (!moneda) {
      throw new HttpException(
        { message: `No existe moneda con id ${id}` },
        HttpStatus.NOT_FOUND,
      )
    }
    return this.repository
      .createQueryBuilder()
      .update()
      .set(updateMonedaDto)
      .where('moneda = :id', { id })
      .execute()
  }

  async findAllPaged(pageOptionsDto: PageOptionsDto) {
    const qb = this.repository.createQueryBuilder('moneda')
    qb.orderBy(
      `moneda.${pageOptionsDto.property ?? 'MONEDA'}`,
      pageOptionsDto.order,
    )
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)

    try {
      const response = await Promise.all([
        qb.getCount(),
        qb.getRawAndEntities(),
      ]).then(([count, data]) => {
        const pageMetaDto = new PageMetaDto({
          itemCount: count,
          pageOptionsDto,
        })
        return new PageDto<Moneda>(data.entities, pageMetaDto)
      })
      return response
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST)
    }
  }

  async remove(id: string) {
    const moneda = await this.repository.findOneBy({
      moneda: id,
    })
    if (!moneda) {
      throw new HttpException(
        { message: `No existe moneda con id ${id}` },
        HttpStatus.NOT_FOUND,
      )
    }
    return this.repository
      .createQueryBuilder()
      .delete()
      .where('moneda = :moneda', { moneda: id })
      .execute()
  }
  async search(pageOptionsDto: PageOptionsDto, search: string) {
    const qb = this.repository.createQueryBuilder('m')
    qb.orderBy(`m.${pageOptionsDto.property ?? 'MONEDA'}`, pageOptionsDto.order)
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)

    qb.where(
      'm.MONEDA LIKE :value OR m.nombre LIKE :value OR m.simbolo LIKE :value',
      { value: `%${search}%` },
    )
    const [count, data] = await Promise.all([
      qb.getCount(),
      qb.getRawAndEntities(),
    ])
    const pageMetaDto = new PageMetaDto({
      itemCount: count,
      pageOptionsDto,
    })
    return new PageDto<Moneda>(data.entities, pageMetaDto)
  }
}
