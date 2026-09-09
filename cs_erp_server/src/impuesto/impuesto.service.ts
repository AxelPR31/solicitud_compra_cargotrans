import { Inject, Injectable } from '@nestjs/common'
import { CreateImpuestoDto } from './dto/create-impuesto.dto'
import { UpdateImpuestoDto } from './dto/update-impuesto.dto'
import { DataSource, Repository } from 'typeorm'
import { Impuesto } from './entities/impuesto.entity'
import { TENANT_CONENCTION } from '../tenant/tenant.module'
import { PaginationDto } from '../common/dto/pagination.dto'

@Injectable()
export class ImpuestoService {
  private repository: Repository<Impuesto>

  constructor(@Inject(TENANT_CONENCTION) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Impuesto)
  }

  async create(createImpuestoDto: CreateImpuestoDto) {
    const existsProduct = await this.repository
      .createQueryBuilder()
      .where('impuesto = :id', { id: createImpuestoDto.impuesto })
      .getOne()

    if (existsProduct) throw new Error('El producto ya existe')

    return await this.repository
      .createQueryBuilder()
      .insert()
      .values(createImpuestoDto)
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
      .where('impuesto like :searchValue or impuesto like :searchValue', {
        searchValue: `%${searchValue}%`,
      })
      .getMany()
  }

  async findOne(id: string) {
    return this.repository
      .createQueryBuilder()
      .where('impuesto = :id', { id })
      .getOne()
  }

  update(id: string, updateImpuestoDto: UpdateImpuestoDto) {
    return this.repository
      .createQueryBuilder()
      .update()
      .set(updateImpuestoDto)
      .where('impuesto = :id', { id })
      .execute()
  }

  async remove(id: string) {
    return await this.repository
      .createQueryBuilder()
      .delete()
      .where('impuesto = :impuesto', { impuesto: id })
      .execute()
  }
}
